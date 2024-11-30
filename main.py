from src.scrapers.twitter_scraper import TwitterScraper
from src.scrapers.linkedin_scraper import LinkedInScraper
import pandas as pd
from datetime import datetime

def main():
    # Initialize scrapers
    twitter_scraper = TwitterScraper()
    # linkedin_scraper = LinkedInScraper()
    
    # Collect data
    twitter_data = twitter_scraper.get_tech_trends()
    # linkedin_data = linkedin_scraper.get_tech_posts()
    
    # Combine all data
    all_data = twitter_data 
    # + linkedin_data
    
    # Convert to DataFrame for easier analysis
    df = pd.DataFrame(all_data)
    
    # Save to CSV with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    df.to_csv(f'tech_trends_{timestamp}.csv', index=False)
    
    print(f"Collected {len(all_data)} trending tech items")

if __name__ == "__main__":
    main() 