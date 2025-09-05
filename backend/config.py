import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:Abhi5566@localhost:5432/bluecarbon')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ETH_NODE_URL = os.getenv('ETH_NODE_URL', 'http://localhost:8545')
    IPFS_ADDR = os.getenv('IPFS_ADDR', '/ip4/127.0.0.1/tcp/5001')
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key')
