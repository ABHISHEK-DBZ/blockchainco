const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy RegistryContract
  console.log("\nDeploying RegistryContract...");
  const RegistryContract = await ethers.getContractFactory("RegistryContract");
  const registryContract = await RegistryContract.deploy();
  await registryContract.waitForDeployment();
  console.log("RegistryContract deployed to:", await registryContract.getAddress());

  // Deploy ProjectContract
  console.log("\nDeploying ProjectContract...");
  const ProjectContract = await ethers.getContractFactory("ProjectContract");
  const projectContract = await ProjectContract.deploy(await registryContract.getAddress());
  await projectContract.waitForDeployment();
  console.log("ProjectContract deployed to:", await projectContract.getAddress());

  // Deploy CarbonCreditTokenContract
  console.log("\nDeploying CarbonCreditTokenContract...");
  const CarbonCreditTokenContract = await ethers.getContractFactory("CarbonCreditTokenContract");
  const baseURI = "https://api.bluecarbon.gov.in/metadata/";
  const carbonCreditContract = await CarbonCreditTokenContract.deploy(
    await projectContract.getAddress(),
    baseURI
  );
  await carbonCreditContract.waitForDeployment();
  console.log("CarbonCreditTokenContract deployed to:", await carbonCreditContract.getAddress());

  // Save deployment addresses
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      RegistryContract: await registryContract.getAddress(),
      ProjectContract: await projectContract.getAddress(),
      CarbonCreditTokenContract: await carbonCreditContract.getAddress()
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require('fs');
  const deploymentPath = `./deployments/deployment-${Date.now()}.json`;
  
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentPath}`);

  // Verify contracts on Etherscan (if not local network)
  const networkName = (await ethers.provider.getNetwork()).name;
  if (networkName !== "hardhat" && networkName !== "localhost" && networkName !== "unknown") {
    console.log("\nWaiting for block confirmations...");
    
    // Wait for confirmations
    const registryReceipt = await registryContract.deploymentTransaction().wait(6);
    const projectReceipt = await projectContract.deploymentTransaction().wait(6);
    const carbonReceipt = await carbonCreditContract.deploymentTransaction().wait(6);

    console.log("Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: await registryContract.getAddress(),
        constructorArguments: [],
      });
      console.log("RegistryContract verified");
    } catch (error) {
      console.log("RegistryContract verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: await projectContract.getAddress(),
        constructorArguments: [await registryContract.getAddress()],
      });
      console.log("ProjectContract verified");
    } catch (error) {
      console.log("ProjectContract verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: await carbonCreditContract.getAddress(),
        constructorArguments: [await projectContract.getAddress(), baseURI],
      });
      console.log("CarbonCreditTokenContract verified");
    } catch (error) {
      console.log("CarbonCreditTokenContract verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
