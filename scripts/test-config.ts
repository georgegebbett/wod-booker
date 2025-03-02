import { loadConfig } from "../src/config";

const testConfig = async () => {
    const config = await loadConfig('classes.toml');
    console.log(config);
}

testConfig();