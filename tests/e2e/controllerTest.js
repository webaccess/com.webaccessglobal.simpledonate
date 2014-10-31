describe("Test Donation page", function () {
  var ptor;
  ptor = protractor.getInstance();
  ptor.ignoreSynchronization = true;

  describe("Test Donation page for Logged in User", function () {
    var firstName = stringGen();
    var lastName = stringGen();
    var userName = firstName;
    var emailId = firstName+'@info.com';
    it ("should create new user", function() {
      ptor.get(ptor.baseUrl+'admin/people/create');
      ptor.findElement(protractor.By.id('edit-name')).sendKeys(userName);
      ptor.findElement(protractor.By.id('edit-mail')).sendKeys(emailId);
      ptor.findElement(protractor.By.id('edit-pass-pass1')).sendKeys(userName);
      ptor.findElement(protractor.By.id('edit-pass-pass2')).sendKeys(userName);
      ptor.findElement(protractor.By.id('first_name')).sendKeys(firstName);
      ptor.findElement(protractor.By.id('last_name')).sendKeys(lastName);
      ptor.findElement(protractor.By.id('postal_code-1')).sendKeys('15201');
      ptor.findElement(protractor.By.id('city-1')).sendKeys('Pittsburgh');
      ptor.findElement(protractor.By.id('street_address-1')).sendKeys('Test street address');
      ptor.findElement(protractor.By.id('edit-roles-3')).click();
      ptor.findElement(protractor.By.cssContainingText('option', 'Pennsylvania')).click();
      ptor.findElement(protractor.By.id('edit-submit')).click();
    });

    it ("should save setting of quick configration page", function() {
      ptor.get(ptor.baseUrl+'civicrm/quick/donation/configuration');
      ptor.findElement(protractor.By.id('_qf_QuickDonationSetting_next-bottom')).click();
      ptor.get(ptor.baseUrl+'user/logout');
      ptor.findElement(protractor.By.id('edit-name')).sendKeys(userName);
      ptor.findElement(protractor.By.id('edit-pass')).sendKeys(userName);
      ptor.findElement(protractor.By.id('edit-submit')).click();
    });

    priceSetTest();

    //user information section
    it ("check session value of login user info", function() {
      var elementUser = ptor.findElement(protractor.By.model('formInfo.user'));
      expect(elementUser.getAttribute('value')).toBe(firstName+' '+lastName);
      var elementEmail = ptor.findElement(protractor.By.model('formInfo.email'));
      expect(elementEmail.getAttribute('value')).toBe(emailId);
      var elementAddress = ptor.findElement(protractor.By.model('formInfo.address'));
      expect(elementAddress.getAttribute('value')).toBe("Test street address");
      var elementZip = ptor.findElement(protractor.By.model('formInfo.zip'));
      expect(elementZip.getAttribute('value')).toBe("15201");
      var elementCity = ptor.findElement(protractor.By.model('formInfo.city'));
      expect(elementCity.getAttribute('value')).toBe("Pittsburgh");
      var elementState = ptor.findElement(protractor.By.model('formInfo.state'));
      expect(elementState.getAttribute('value')).toBe("Pennsylvania");
    });
    creditInfoTest(emailId);
  });

  describe("Test Donation for anonymous user", function () {
    var firstName = stringGen();
    var lastName = stringGen();
    var userName = firstName;
    var emailId = firstName+'@info.com';
    priceSetTest();
    //user information section
    it ("should hide city and state", function() {
      var elementCity = ptor.findElement(protractor.By.model('formInfo.city'));
      expect(elementCity.isDisplayed()).toBe(false);
      var elementstate = ptor.findElement(protractor.By.model('formInfo.state'));
      expect(elementstate.isDisplayed()).toBe(false);
    });

    it ("should show proper city and state on enter of zip", function() {
      ptor.findElement(protractor.By.model('formInfo.user')).sendKeys(firstName+' '+lastName);
      ptor.findElement(protractor.By.model('formInfo.email')).sendKeys(emailId);
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

    creditInfoTest(emailId);
  });

  function creditInfoTest(emailId) {
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
      ptor.sleep(1000);
      expect(ptor.getCurrentUrl()).toContain('donation/thanks');
      expect(ptor.findElement(protractor.By.css('p.ng-binding')).getText()).toContain(emailId);
      ptor.get(ptor.baseUrl+'user/logout');
    });
  }

  function priceSetTest() {
    it ("should redirect to donation page", function() {
      ptor.get(ptor.baseUrl+'civicrm/quick?test=1#/donation');
      ptor.sleep(500);
      expect(ptor.getCurrentUrl()).toContain('civicrm/quick?test=1#/donation');
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

    it ("enter value in other amount and display total donation div", function() {
      var otheramt = ptor.findElement(protractor.By.model('formInfo.otherAmount'));
      otheramt.click();
      otheramt.sendKeys('6000');
      expect(element(by.className('priceSetMessage')).isDisplayed()).toBe(true);
      expect(element(by.className('priceSetMessage')).getText()).toContain('6000');
      ptor.findElement(protractor.By.css('button.donate-sub')).click();
    });
  }

  function getSelectedAmt() {
    element.all(by.repeater('price in priceListInfo')).then(function(prices) {
      var priceElement = prices[0].element(by.tagName('label')).getText();
      priceElement.then(function(slices) {
        expect(ptor.findElement(protractor.By.css('div.priceSetMessage')).getText()).toBe('Donation amount: '+slices);
      });
    });  
  }
  
  function isPresentCreditElement(display) {
    var elcardExpiry = ptor.findElement(protractor.By.model('formInfo.cardExpiry'));
    expect(elcardExpiry.isDisplayed()).toBe(display);
    var elsecurityCode = ptor.findElement(protractor.By.model('formInfo.securityCode'));
    expect(elsecurityCode.isDisplayed()).toBe(display);
    var elzipCode = ptor.findElement(protractor.By.model('formInfo.zipCode'));
    expect(elzipCode.isDisplayed()).toBe(display);
  }

  //to generate random words
  function stringGen() {
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyz";
    for( var i=0; i < 6; i++ )
      text += charset.charAt(Math.floor(Math.random()*charset.length));
    return text;
  }
});
