import tweepy
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import time
import re
import urllib3
import warnings
import logging

# Suppress the urllib3 warning
warnings.filterwarnings('ignore', category=urllib3.exceptions.NotOpenSSLWarning)

class TwitterScraper:
    def __init__(self):
        load_dotenv()
        
        self.client = tweepy.Client(
            bearer_token=os.getenv('TWITTER_BEARER_TOKEN'),
            consumer_key=os.getenv('TWITTER_API_KEY'),
            consumer_secret=os.getenv('TWITTER_API_SECRET'),
            access_token=os.getenv('TWITTER_ACCESS_TOKEN'),
            access_token_secret=os.getenv('TWITTER_ACCESS_TOKEN_SECRET'),
            wait_on_rate_limit=True
        )
        self.last_request_time = None
        self.request_count = 0

    def handle_rate_limit(self):
        """Manage rate limiting with a more conservative approach"""
        current_time = time.time()
        
        if self.last_request_time is None:
            self.last_request_time = current_time
            self.request_count = 1
            logging.info(f"First request initiated")
            return
        
        time_elapsed = current_time - self.last_request_time
        
        if time_elapsed >= 900:
            logging.info(f"15 minutes passed, resetting counter")
            self.request_count = 0
            self.last_request_time = current_time
        
        self.request_count += 1
        logging.info(f"Request #{self.request_count} in current window")
        
        if self.request_count >= 15:
            wait_time = 900 - time_elapsed + 60
            if wait_time > 0:
                logging.warning(f"Rate limit approaching. Waiting for {int(wait_time)}s")
                time.sleep(wait_time)
                self.request_count = 0
                self.last_request_time = time.time()
        else:
            logging.info(f"Waiting 3s between requests")
            time.sleep(3)

    def clean_tweet(self, tweet):
        """Clean tweet text by removing links, special characters"""
        tweet = re.sub(r'http\S+|www\S+|https\S+', '', tweet, flags=re.MULTILINE)
        tweet = re.sub(r'\n', ' ', tweet)
        tweet = re.sub(r'@\w+', '', tweet)  # Remove mentions
        tweet = re.sub(r'#', '', tweet)     # Remove hashtag symbol but keep text
        return tweet.strip()

    def is_relevant_tweet(self, tweet, min_engagement=10):
        """Check if tweet is relevant based on various criteria"""
        # Check engagement
        total_engagement = tweet.public_metrics['like_count'] + tweet.public_metrics['retweet_count']
        if total_engagement < min_engagement:
            return False
        
        # Filter out tweets that are too short
        if len(tweet.text) < 50:
            return False
        
        # Filter out likely spam or promotional content
        spam_patterns = [
            r'buy now',
            r'click here',
            r'limited time',
            r'giveaway',
            r'follow me',
            r'check out my',
        ]
        
        lower_text = tweet.text.lower()
        if any(re.search(pattern, lower_text) for pattern in spam_patterns):
            return False
            
        return True

    def get_tech_trends(self, max_results=5):  # Reduced max_results to be more conservative
        tech_topics = {
            'AI/ML': 'AI OR "Artificial Intelligence" min_faves:100',
            'Web Development': 'WebDev min_faves:50',
            'Cloud Computing': 'AWS OR Azure min_faves:50',
            'Cybersecurity': 'Cybersecurity min_faves:50',
        }
        
        tweets = []
        for topic, query in tech_topics.items():
            try:
                # Handle rate limiting
                self.handle_rate_limit()
                
                response = self.client.search_recent_tweets(
                    query=f"{query} -is:retweet lang:en",
                    max_results=max_results,
                    tweet_fields=['created_at', 'public_metrics', 'author_id']
                )
                
                if response and response.data:
                    for tweet in response.data:
                        if self.is_relevant_tweet(tweet):
                            clean_content = self.clean_tweet(tweet.text)
                            tweets.append({
                                'source': 'Twitter',
                                'topic': topic,
                                'content': clean_content,
                                'timestamp': tweet.created_at,
                                'engagement': tweet.public_metrics['like_count'] + 
                                            tweet.public_metrics['retweet_count']
                            })
                    
            except tweepy.TooManyRequests:
                print(f"Rate limit reached for {topic}, waiting for 15 minutes...")
                time.sleep(900)  # Wait 15 minutes
                continue
            except Exception as e:
                print(f"Error fetching tweets for {topic}: {str(e)}")
                continue
                
        return tweets

    def format_trends_report(self, tweets):
        """Format tweets into a readable report"""
        report = "🚀 Tech Trends Report\n\n"
        
        for topic in set(tweet['topic'] for tweet in tweets):
            report += f"📌 {topic}\n"
            topic_tweets = [t for t in tweets if t['topic'] == topic]
            
            for tweet in topic_tweets[:3]:  # Top 3 tweets per topic
                report += f"- {tweet['content'][:200]}...\n"
                report += f"  Engagement: 👍 {tweet['likes']} 🔄 {tweet['retweets']}\n\n"
            
            report += "\n"
            
        return report