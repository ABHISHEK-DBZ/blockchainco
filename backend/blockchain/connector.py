import os
from web3 import Web3

class BlockchainConnector:
    def __init__(self):
        # Connect to local Ethereum node or Infura
        eth_node_url = os.getenv('ETH_NODE_URL', 'http://localhost:8545')
        self.web3 = Web3(Web3.HTTPProvider(eth_node_url))
        if not self.web3.isConnected():
            raise Exception('Unable to connect to Ethereum node')

    def get_balance(self, address):
        # Returns balance in Ether
        return self.web3.fromWei(self.web3.eth.get_balance(address), 'ether')

    def send_transaction(self, from_addr, private_key, to_addr, value_ether):
        # Send Ether transaction
        tx = {
            'nonce': self.web3.eth.get_transaction_count(from_addr),
            'to': to_addr,
            'value': self.web3.toWei(value_ether, 'ether'),
            'gas': 21000,
            'gasPrice': self.web3.toWei('50', 'gwei')
        }
        signed_tx = self.web3.eth.account.sign_transaction(tx, private_key)
        tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        return self.web3.toHex(tx_hash)

    def call_smart_contract(self, contract_address, abi, function_name, *args):
        contract = self.web3.eth.contract(address=contract_address, abi=abi)
        func = getattr(contract.functions, function_name)
        return func(*args).call()

    def transact_smart_contract(self, contract_address, abi, function_name, from_addr, private_key, *args):
        contract = self.web3.eth.contract(address=contract_address, abi=abi)
        func = getattr(contract.functions, function_name)(*args)
        tx = func.build_transaction({
            'from': from_addr,
            'nonce': self.web3.eth.get_transaction_count(from_addr),
            'gas': 2000000,
            'gasPrice': self.web3.toWei('50', 'gwei')
        })
        signed_tx = self.web3.eth.account.sign_transaction(tx, private_key)
        tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        return self.web3.toHex(tx_hash)
