describe("Test Donation page", function () {
  var ptor;
  ptor = protractor.getInstance();
  ptor.ignoreSynchronization = true;
  var contriTitle = "Test "+stringGen();
  var firstName = stringGen();
  var lastName = stringGen();
  var userName = firstName;
  var emailId = firstName+'@info.com';

  describe("Contribution Page", function () {
    it ("should create new contribution", function() {
      ptor.get(ptor.baseUrl+'civicrm/admin/contribute/add?reset=1&action=add');
      ptor.findElement(protractor.By.id('title')).sendKeys(contriTitle);
      ptor.findElement(protractor.By.cssContainingText('option', 'Donation')).click();
      ptor.findElement(protractor.By.id('_qf_Settings_next-bottom')).click();
      ptor.sleep(500);
      expect(ptor.getCurrentUrl()).toContain('contribute/amount');
      ptor.findElement(protractor.By.css('input#payment_processor_1')).click();
      ptor.findElement(protractor.By.css('input#is_recur')).click();
      ptor.findElement(protractor.By.id('label_1')).sendKeys('TestAm1');
      ptor.findElement(protractor.By.id('value_1')).sendKeys('1000');
      ptor.findElement(protractor.By.id('label_2')).sendKeys('TestAm2');
      ptor.findElement(protractor.By.id('value_2')).sendKeys('2000');
      ptor.findElement(protractor.By.xpath('//table[@id="map-field-table"]/tbody/tr[3]/td[3]/input')).click();
      ptor.findElement(protractor.By.id('_qf_Amount_upload_done-bottom')).click();
    });
  });

  describe("Test Donation page for Logged in User when ziptastic enable", function () {
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

    it ("should save setting of simple configration page", function() {
      ptor.get(ptor.baseUrl+'civicrm/simple/donation/configuration');
      ptor.sleep(1000);
      ptor.findElement(protractor.By.cssContainingText('option', contriTitle)).click();
      ptor.findElement(protractor.By.id('_qf_SimpleDonationSetting_next-bottom')).click();
      ptor.get(ptor.baseUrl+'user/logout');
      login(userName);
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

  describe("Test Donation for anonymous user when ziptastic enable", function () {
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
      ptor.findElement(protractor.By.model('formInfo.zip')).sendKeys('15201');
      ptor.sleep(3000);
      var elementCity = ptor.findElement(protractor.By.model('formInfo.city'));
      expect(elementCity.isDisplayed()).toBe(true);
      expect(elementCity.getAttribute('value')).toBe("Pittsburgh");
      var elementState = ptor.findElement(protractor.By.model('formInfo.state'));
      expect(elementState.isDisplayed()).toBe(true);
      expect(elementState.getAttribute('value')).toBe("Pennsylvania");
    });

    creditInfoTest(emailId);
  });

  describe("Test Donation page for Logged in User when ziptastic disable", function () {
    it ("should save setting of simple configration page", function() {
      ptor.get(ptor.baseUrl);
      login(userName);
      ptor.get(ptor.baseUrl+'civicrm/simple/donation/configuration');
      ptor.sleep(1000);
      ptor.findElement(protractor.By.id('ziptastic')).click();
      ptor.findElement(protractor.By.id('_qf_SimpleDonationSetting_next-bottom')).click();
      ptor.get(ptor.baseUrl+'user/logout');
      login(userName);
    });

    priceSetTest();

    //user information section
    it ("check session value of login user info", function() {
      expect(ptor.findElement(protractor.By.model('formInfo.user')).getAttribute('value')).toBe(firstName+' '+lastName);
      expect(ptor.findElement(protractor.By.model('formInfo.email')).getAttribute('value')).toBe(emailId);
      expect(ptor.findElement(protractor.By.model('formInfo.address')).getAttribute('value')).toBe("Test street address");
      expect(ptor.findElement(protractor.By.model('formInfo.zip')).getAttribute('value')).toBe("15201");
      expect(ptor.findElement(protractor.By.model('formInfo.city')).getAttribute('value')).toBe("Pittsburgh");
      element(by.model('formInfo.country')).getAttribute('value').then(function (selectValue) {
        expect(element(by.css('select option[value="' + selectValue + '"]')).getText()).toEqual('United States');
      });
      element(by.model('formInfo.stateList')).getAttribute('value').then(function (selectVal) {
        expect(element(by.css('select option[value="' + selectVal + '"]')).getText()).toEqual('Pennsylvania');
      });
    });
    creditInfoTest(emailId);
  });

  describe("Test Donation for anonymous user when ziptastic disable", function () {
    var firstName = stringGen();
    var lastName = stringGen();
    var userName = firstName;
    var emailId = firstName+'@info.com';
    priceSetTest();
    it ("should fill proper info for user section", function() {
      ptor.findElement(protractor.By.model('formInfo.user')).sendKeys(firstName+' '+lastName);
      ptor.findElement(protractor.By.model('formInfo.email')).sendKeys(emailId);
      ptor.findElement(protractor.By.model('formInfo.address')).sendKeys('123 Main Land street');
      ptor.findElement(protractor.By.model('formInfo.zip')).sendKeys('15201');
      ptor.findElement(protractor.By.cssContainingText('option', 'United States')).click();
      ptor.findElement(protractor.By.cssContainingText('option', 'Pennsylvania')).click();
      ptor.findElement(protractor.By.model('formInfo.city')).sendKeys('Pittsburgh');
    });
    creditInfoTest(emailId);
  });


  function creditInfoTest(emailId) {
    //credit card section
    it ("should check for credit card information",function() {
      ptor.findElement(protractor.By.css('button.donate-sub')).click();
      isPresentCreditElement(false);
      ptor.findElement(protractor.By.model('formInfo.cardNumberValue')).sendKeys('4100000000000000');
      isPresentCreditElement(true);
      ptor.findElement(protractor.By.model('formInfo.cardExpiry')).click();
      ptor.findElement(protractor.By.model('formInfo.cardExpiry')).sendKeys('0820');
      ptor.findElement(protractor.By.model('formInfo.securityCode')).sendKeys('510');
      var elementSubmit = ptor.findElement(protractor.By.css('button.donate-submit-btn'));
      elementSubmit.click();
      ptor.sleep(3000);
      expect(ptor.getCurrentUrl()).toContain('donation/thanks');
      expect(ptor.findElement(protractor.By.css('strong.ng-binding')).getText()).toContain(emailId);
      ptor.get(ptor.baseUrl+'user/logout');
    });
  }

  function priceSetTest() {
    it ("should redirect to donation page", function() {
      ptor.get(ptor.baseUrl+'civicrm/simple?test=1#/donation');
      ptor.sleep(1500);
      expect(ptor.getCurrentUrl()).toContain('civicrm/simple?test=1#/donation');
    });

   it ("should check default priceset is set", function() {
     getSelectedAmt(1);
   });

    //priceset section test case
    it ("should display total donation div on hover of price", function() {
      ptor.actions().mouseMove(ptor.findElement(protractor.By.css('ul.priceSet li:nth-child(1)'))).perform();
      getSelectedAmt(0);
    });

    it ("should click on first price and display total donation div", function() {
      ptor.findElement(protractor.By.css('ul.priceSet li:nth-child(1)')).click();
      getSelectedAmt(0);
    });

    it ("enter value in other amount and display total donation div", function() {
      element.all(by.model('formInfo.otherAmount')).then(function(items) {
        if (items.length == 1) {
          var otheramt = ptor.findElement(protractor.By.model('formInfo.otherAmount'));
          otheramt.click();
          otheramt.sendKeys('6000');
          expect(element(by.className('priceSetMessage')).isDisplayed()).toBe(true);
          expect(element(by.className('priceSetMessage')).getText()).toContain('6000');
        }
      });
      ptor.findElement(protractor.By.css('button.donate-sub')).click();
    });

    it ("click recurring checkbox", function() {
      element.all(by.model('formInfo.recur')).then(function(items) {
        if (items.length == 1) {
          ptor.findElement(protractor.By.css('input#isRecur')).click();
        }
      });
    });
  }

  function login(userName) {
    ptor.findElement(protractor.By.id('edit-name')).sendKeys(userName);
    ptor.findElement(protractor.By.id('edit-pass')).sendKeys(userName);
    ptor.findElement(protractor.By.id('edit-submit')).click();
  }

  function getSelectedAmt(index) {
    element.all(by.repeater('price in priceListInfo')).then(function(prices) {
      var priceElement = prices[index].element(by.tagName('label')).getText();
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
