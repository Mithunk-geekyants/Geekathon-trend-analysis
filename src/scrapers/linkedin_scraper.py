from linkedin_api import Linkedin
from datetime import datetime
import os
from dotenv import load_dotenv

class LinkedInScraper:
    def __init__(self):
        load_dotenv()
        
        # Initialize LinkedIn API
        self.api = Linkedin(
            os.getenv('LINKEDIN_USERNAME'),
            os.getenv('LINKEDIN_PASSWORD')
        )

    def get_tech_posts(self, max_results=100):
        tech_companies = ['microsoft', 'google', 'apple', 'meta', 'amazon']
        posts = []
        
        try:
            for company in tech_companies:
                company_posts = self.api.get_company_updates(
                    company,
                    max_results=max_results
                )
                
                for post in company_posts:
                    posts.append({
                        'source': 'LinkedIn',
                        'company': company,
                        'content': post.get('text', ''),
                        'timestamp': post.get('time'),
                        'engagement': post.get('likes', 0)
                    })
                    
        except Exception as e:
            print(f"Error fetching LinkedIn posts: {str(e)}")
            
        return posts 