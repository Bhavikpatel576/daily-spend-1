const { Builder, By, Key, until } = require('selenium-webdriver');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// /div/div/div/div/div/div/input

(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  const Actions = driver.actions;
  const builder = Actions(driver);

  try {
    await driver.get('http://localhost:8000/');
    driver.manage().window().maximize();
    const res = await driver.findElement(By.tagName('button')).sendKeys('webdriver', Key.RETURN);

    await driver.switchTo().frame('plaid-link-iframe-1');
    await sleep(1000);

    const input = driver.findElement(By.xpath("html/body/div/div/div/div/div/div/div/input"));
    await input.sendKeys("chase");

    await sleep(1000);

    const bank = driver.findElement(By.xpath("html/body/div/div/div/div/div/div/div/div/ul/li"));
    await bank.click();

    await sleep(1000);

    const inputs = await driver.findElements(By.xpath("html/body/div/div/div/div/div/div/form/div/div/input"));
    await inputs[0].sendKeys("user_good");
    await inputs[1].sendKeys("pass_good");

    const submit = driver.findElement(By.xpath("html/body/div/div/div/div/div/div/form/button"));
    await submit.click();

  } finally {
    sleep(9000);
    await driver.quit();
  }
})();