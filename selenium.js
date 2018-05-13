const { Builder, By, Key, until } = require('selenium-webdriver');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// /div/div/div/div/div/div/input

(async function example() {
  let driver = await new Builder().forBrowser('firefox').build();
  // const builder = new Actions(driver);

  try {
    await driver.get('http://localhost:8000/');
    driver.manage().window().maximize();
    const res = await driver.findElement(By.tagName('button')).sendKeys('webdriver', Key.RETURN);
    await driver.switchTo().frame(0);
    await sleep(1000);
    const element = driver.findElement(By.xpath("html/body/div/div/div/div/div/div/div/input"));
    await element.sendKeys("chase");
    await element.click();
    // builder.moveToElement(element, X, Y).click().build().perform();
  } finally {
    await sleep(9000);
    await driver.quit();
  }
})();