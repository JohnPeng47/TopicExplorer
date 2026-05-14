from pymongo import MongoClient
from dynaconf import Dynaconf
from config import settings


# MongoDB connection details
DB_NAME = settings.DB
DB_HOST = settings.DB_HOST
DB_PORT = settings.DB_PORT

# Collections to clear
COLLECTIONS = ["documents", "document_lists"]

def clear_collection(db, collection_name):
    result = db[collection_name].delete_many({})
    print(f"Cleared '{collection_name}' collection. Deleted {result.deleted_count} documents.")

def main():
    # Create a MongoDB client
    client = MongoClient(f"mongodb://{DB_HOST}:{DB_PORT}")
    
    # Connect to the database
    db = client[DB_NAME]
    
    # Clear each collection
    for collection in COLLECTIONS:
        clear_collection(db, collection)
    
    # Print remaining document counts
    for collection in COLLECTIONS:
        count = db[collection].count_documents({})
        print(f"Remaining documents in '{collection}' collection: {count}")
    
    print("All specified collections have been cleared.")
    
    # Close the connection
    client.close()

if __name__ == "__main__":
    main()