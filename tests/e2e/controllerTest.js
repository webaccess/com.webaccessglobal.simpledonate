describe("Test Donation page", function () {
  var ptor;
  it ("should redirect to donation page", function() {
    ptor = protractor.getInstance();
    ptor.ignoreSynchronization = true;
    ptor.get(ptor.baseUrl+'civicrm/a/#/donation'); 
    ptor.sleep(500);
    expect(ptor.getCurrentUrl()).toContain('/a/#/donation');
  });

  //priceset section test case
  it ("should not display total donation div ", function () {
    expect(element(by.className('priceSetMessage')).isDisplayed()).toBe(false);
  });

  it ("should display total donation div on hover of price", function() {
    ptor.actions().mouseMove(ptor.findElement(protractor.By.css('ul.priceSet li:nth-child(1)'))).perform();
    getSelectedAmt();
  });

  it ("should click on first price and display total donation div", function() {
    ptor.findElement(protractor.By.css('ul.priceSet li:nth-child(1)')).click();
    getSelectedAmt();
  });
  
  function getSelectedAmt() {
    element.all(by.repeater('price in priceListInfo')).then(function(prices) {
      var priceElement = prices[0].element(by.tagName('label')).getText();
      priceElement.then(function(slices) {
        expect(ptor.findElement(protractor.By.css('div.priceSetMessage')).getText()).toBe('Donation amount: '+slices);
      });
    });  
  }
  
  it ("enter value in other amount and display total donation div", function() {
    var otheramt = ptor.findElement(protractor.By.model('formInfo.otherAmount'));
    otheramt.click();
    otheramt.sendKeys('6000');
    expect(element(by.className('priceSetMessage')).isDisplayed()).toBe(true);
    expect(element(by.className('priceSetMessage')).getText()).toContain('6000');
  });  

  //user information section
  it ("should hide city and state", function() {
    ptor.findElement(protractor.By.css('button.donate-sub')).click();
    var elementCity = ptor.findElement(protractor.By.model('formInfo.city'));
    expect(elementCity.isDisplayed()).toBe(false);
    var elementstate = ptor.findElement(protractor.By.model('formInfo.state'));
    expect(elementstate.isDisplayed()).toBe(false);
  });

  it ("should show proper city and state on enter of zip", function() {
    ptor.findElement(protractor.By.model('formInfo.user')).sendKeys('abc xyz');
    ptor.findElement(protractor.By.model('formInfo.email')).sendKeys('abc@info.com');
    ptor.findElement(protractor.By.model('formInfo.address')).sendKeys('123 Main Land street');
    ptor.findElement(protractor.By.model('formInfo.zip')).sendKeys('15425');
    ptor.sleep(2000);
 
    var elementCity = ptor.findElement(protractor.By.model('formInfo.city'));
    expect(elementCity.isDisplayed()).toBe(true);
    expect(elementCity.getAttribute('value')).toBe("Connellsville");
    
    var elementState = ptor.findElement(protractor.By.model('formInfo.state'));
    expect(elementState.isDisplayed()).toBe(true);
    expect(elementState.getAttribute('value')).toBe("Pennsylvania");
  });

  //credit card section
  it ("should check for credit card information",function() {
    ptor.findElement(protractor.By.css('button.donate-sub')).click();
    ptor.findElement(protractor.By.css('ul.paymentProcessor li:nth-child(1) input')).click();
    isPresentCreditElement(false);
	
    ptor.findElement(protractor.By.model('formInfo.cardNumberValue')).sendKeys('4100000000000000');
    isPresentCreditElement(true);
    ptor.findElement(protractor.By.model('formInfo.cardExpiry')).sendKeys('0820');
    ptor.findElement(protractor.By.model('formInfo.securityCode')).sendKeys('510');
    ptor.findElement(protractor.By.model('formInfo.zipCode')).sendKeys('15425');

    var elementSubmit = ptor.findElement(protractor.By.css('button.donate-submit-btn'));
    elementSubmit.click();
    expect(elementSubmit.getText()).toBe('Saving...');
    ptor.sleep(500);
  });
  
  function isPresentCreditElement(display) {
    var elcardExpiry = ptor.findElement(protractor.By.model('formInfo.cardExpiry'));
    expect(elcardExpiry.isDisplayed()).toBe(display);
    var elsecurityCode = ptor.findElement(protractor.By.model('formInfo.securityCode'));
    expect(elsecurityCode.isDisplayed()).toBe(display);
    var elzipCode = ptor.findElement(protractor.By.model('formInfo.zipCode'));
    expect(elzipCode.isDisplayed()).toBe(display);
  }
});
