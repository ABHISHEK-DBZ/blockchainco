import ipfshttpclient
import os

class IPFSConnector:
    def __init__(self):
        ipfs_addr = os.getenv('IPFS_ADDR', '/ip4/127.0.0.1/tcp/5001')
        self.client = ipfshttpclient.connect(ipfs_addr)

    def upload_file(self, file_path):
        res = self.client.add(file_path)
        return res['Hash']

    def get_file(self, file_hash, output_path):
        self.client.get(file_hash, target=output_path)
        return output_path
