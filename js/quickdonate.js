(function(angular, $, _) {

  var resourceUrl = CRM.resourceUrls['com.webaccessglobal.quickdonate'];
  var quickDonation = angular.module('quickdonate', ['ngRoute']);
  quickDonation.config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/donation', {
        templateUrl: resourceUrl + '/partials/quickdonate.html',
        controller: 'QuickDonationCtrl'
      });
    }
  ]);

  quickDonation.factory('formFactory', function($q) {
    return {
      getUser:function(contactID) {
        var deferred = $q.defer();
	if (contactID) {
          CRM.api3('Contact', 'get', {
            "sequential": 1,
            "id": contactID
          }).done(function(data) {
            cj.each( data.values, function( key, value ) {
              resultParams = value;
            });
            deferred.resolve(resultParams);
          }).error(function(data, status, headers, config) {
            deferred.reject("there was an error");
          });
	}
	return deferred.promise;
      },
    };
  });

  quickDonation.controller('QuickDonationCtrl', function($scope, formFactory) {
    //set donaiton page ID
    $scope.donationID = CRM.quickdonate.donatePageID;
    $scope.currencySymbol = CRM.quickdonate.currency;
    $scope.paymentProcessor = CRM.quickdonate.paymentProcessor;
    $scope.donationConfig = CRM.quickdonate.config;
    $scope.priceListInfo = CRM.quickdonate.priceList;
    $scope.otherAmount = CRM.quickdonate.otherAmount;
    $scope.test = CRM.quickdonate.isTest;
    $scope.section = 1;

    //manually binds Parsley--Validation Library to this form.
    $('#quickDonationForm').parsley({
    excluded: "input[type=button], input[type=submit], input[type=reset], input[type=hidden], input:hidden"
});

    //get session
    formFactory.getUser(CRM.quickdonate.sessionContact).then(function(resultParams) {
      $scope.formInfo.email = resultParams.email;
      $scope.formInfo.user = resultParams.first_name +' '+ resultParams.last_name;
      $scope.formInfo.address = resultParams.street_address;
      if (resultParams.postal_code) {
        $scope.formInfo.zip = resultParams.postal_code;
        $scope.formInfo.city = resultParams.city;
        $scope.formInfo.state = $.map(CRM.quickdonate.allStates, function(obj, index) {
          if(obj == resultParams.state_province_id) {
            return index;
          }
        });
        $('#state').parent().show();
        $('#city').parent().show();
      }
    });

    $scope.formInfo = {}; //property is set to bind input value

    $scope.hidePriceVal = true;
    $scope.amountSelected = function(price) {
      $scope.hidePriceVal = false;
      $scope.amount = price;
    }

    $scope.amountActive = function(price) {
     return $scope.amount === price;
    }

    $scope.amounthover = function(price) {
      $scope.formInfo.donateAmount = price;
      $scope.hidePriceVal = false;
      return $scope.message;
    }
      $scope.selectedRow = null;
    $scope.selectedCardType = function(row) {
      $scope.selectedRow = row;
    };

    $scope.sectionShow = function() {
      $scope.section = $scope.section + 1;
    };

    ccDefinitions = {
      'Visa': /^4/,
      'MasterCard': /^5[1-5]/,
      'Amex': /^3(4|7)/,
      'Discover': /^6011/
    };

    $scope.selectedSection = function(sectionNo) {
      return sectionNo <= $scope.section ;
    };

    $scope.getCreditCardType = function(number){
      var ccType;
      $.each(ccDefinitions, function (i, v) {
        if (v.test(number)) {
          ccType = i;
          return false;
        }
      });
      return ccType;
    };

    $scope.createContribution = function (contactId,params) {
      //get contribution page
      var resultParams =$scope.donationConfig;//<?php echo json_encode($contributionPage);?>;
      $scope.amount = $scope.formInfo.otherAmount || $scope.formInfo.donateAmount || 1;
      $scope.contributionparams = {
        "credit_card_number": $scope.cardNumberValue,
        "cvv2": $scope.formInfo.securityCode,
        "credit_card_type": $scope.getCreditCardType($scope.cardNumberValue),
        "billing_first_name": params.first_name,
        "first_name": params.first_name,
        "billing_middle_name": params.middle_name,
        "middle_name": params.middle_name,
        "billing_last_name": params.last_name,
        "last_name": params.last_name,
        "billing_street_address-5": params.street_address,
        "street_address": params.street_address,
        "billing_city-5": params.city,
        "city": params.city,
        "billing_country_id-5": params.country_id,
        "country_id": params.country_id,
        "billing_state_province_id-5": params.state_province_id,
        "state_province_id": params.state_province_id,
        "billing_postal_code-5": params.postal_code,
        "postal_code": params.postal_code,
        "year": "20"+$scope.year,
        "month": $scope.month,
        "email": params.email,
        "contribution_page_id": resultParams.id,
        "payment_processor_id": $scope.formInfo.payment_processor,
        "is_test": $scope.test,
        "total_amount": $scope.amount,
        "financial_type_id": resultParams.financial_type_id,
        "currencyID": resultParams.currency,
        "currency": resultParams.currency,
        "skipLineItem": 0,
        "skipRecentView": 1,
        "contact_id": contactId,
        "address_id": params.address_id,
        "source": "Online Contribution: " + resultParams.title,
      };

      CRM.api3('Contribution', 'transact', $scope.contributionparams ).success(function(data, status, headers, config) {
          if (data.is_error == 0) {
	      CRM.alert('Donation has been submitted successfully!!', 'alert');
              //window.location = 'civicrm/quick/#/donation';
          }
          else {
            cj('.error').html(data.error_message);
          }
        });
    }
    $scope.existUserContri = function(contactId,addressID) {
      CRM.api3('Address', 'create', {
        'contact_id': "null",
        'location_type_id': 5,
	'country_id' : CRM.quickdonate.$defaultContactCountry,
        'street_address': $scope.formInfo.address,
        'city': $scope.formInfo.city,
        'state_province_id': $scope.state,
        'postal_code': $scope.formInfo.zip,
        'name': $scope.formInfo.user,
        'is_billing': 1,
        'is_primary': 0,
        'api.Address.update':{'id':addressID, 'contact_id': $scope.contact_id, 'is_billing':1,'street_address':$scope.formInfo.address,'city':$scope.formInfo.city,'postal_code':$scope.formInfo.zip},
      });
      formFactory.getUser(contactId).then(function(resultParams) {
        $scope.createContribution(contactId,resultParams);
      });
    }
    $scope.newUserContri = function(contactId) {
      primaryValue = [0,1];
      contactID = ['null',contactId];
      cj.each( primaryValue, function( key, value ) {
        CRM.api3('Address', 'create', {
          'contact_id': contactID[key] ,
          'location_type_id': 5,
	  'country_id' : CRM.quickdonate.$defaultContactCountry,
          'street_address': $scope.formInfo.address,
          'city': $scope.formInfo.city,
          'state_province_id': $scope.state,
          'postal_code': $scope.formInfo.zip,
          'name': $scope.formInfo.user,
          'is_billing': 1,
          'is_primary': primaryValue[key]
        });
      });
      formFactory.getUser(contactId).then(function(resultParams) {
        $scope.createContribution(contactId,resultParams);
      });
    };

    $scope.saveData = function() {
      $scope.amount = $scope.formInfo.otherAmount || $scope.formInfo.donateAmount;
      $scope.state = CRM.quickdonate.allStates[$scope.formInfo.state];
      $scope.country = CRM.quickdonate.country;
      $scope.names = $scope.formInfo.user.split(' ');
      $scope.expiry = $scope.formInfo.cardExpiry.split('/');
      $scope.month = $scope.expiry[0];
      $scope.year = $scope.expiry[1];
      $scope.ccType = true;

      CRM.api3('Contact', 'get', {
        "email": $scope.formInfo.email,
        "contact_type":"Individual"
      }).success(function(data, status, headers, config) {
        var counter = 0, resultParams = {};
        cj.each( data.values, function( key, value ) {
          counter++;
          if (counter == 1) {
            resultParams = value;
          }
        });

        if (resultParams.contact_id && resultParams.address_id ) {
          $scope.existUserContri(resultParams.contact_id,resultParams.address_id);
        }
        else if(resultParams.contact_id && !resultParams.address_id){
          $scope.newUserContri(resultParams.contact_id);
        }
        else{
          CRM.api3('Contact', 'create', {
            "email":$scope.formInfo.email,
            "first_name": $scope.names[0],
            "last_name": $scope.names[1],
	    "contact_type":"Individual"
          }).success(function(data, status, headers, config) {
            $scope.newUserContri(data.id);
          });
        }
        $scope.quickDonationForm.$setPristine();
      });
    };

    $scope.creditType = false;
    $scope.directDebitType = false;
    $scope.hiddenProcessor = false;

    $scope.setPaymentBlock = function(value) {
	$billingmodeform = 1;//billing-mode-form = 1
	//billing-mode-button = 2
	//billing-mode-notify = 4
	//payment-type-credit-card = 1
	//payemt-type-direct-debit = 2
	if($scope.paymentProcessor[value]['billing_mode'] & $billingmodeform /*billing_mode_form*/) {
	  if($scope.paymentProcessor[value]['payment_type'] == 1) {
	    $scope.creditType = true;
	    $scope.directDebitType = false;
	    $scope.hiddenProcessor = false;
	  }
	  else if($scope.paymentProcessor[value]['payment_type'] == 2) {
	    $scope.directDebitType = true;
	    $scope.creditType = false;
	    $scope.hiddenProcessor = false;
	  }
	}
	else {
	  $scope.hiddenProcessor = true;
	  $scope.creditType = false;
	  $scope.directDebitType = false;
	}
    }
  });

  quickDonation.directive('creditCardExpiry', function(){
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        expirationComplete = function() {
          elm.addClass("full")
            .unbind("keydown blur")
            .bind("keydown", function (e) {
              if (e.keyCode === 8 && $(this).val() === "") {
                $(this).removeClass("full");
                  if (window.navigator.standalone || !Modernizr.touch) {
                    $("#cardNumber").focus();
                  }
                }
            });
          if (window.navigator.standalone || !Modernizr.touch) {
            setTimeout(function () {
              $("#securityCode").focus();
            }, 220);
          }
        }
	$(elm).inputmask({mask: "m/q", placeholder:"MM/YY", clearIncomplete: true, oncomplete: expirationComplete});
      }
    }
    return directive
  });

  quickDonation.directive('securityCode', function(){
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        elm.bind('keyup', function() {
          if (scope.quickDonationForm.securityCode.$valid) {
            $('#zipCode').focus();
	  }
        });
      }
    }
    return directive
  });

  quickDonation.directive('creditCardType', function(){
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        scope.formInfo.cardNumberValue = null;
        $(elm).inputmask({mask: "9999 9999 9999 9999", placeholder: "1234 5678 9012 3456"});
        creditCardComplete = function() {
          // We need to get the credit card field and the unmasked value of the field.
          scope.cardNumberValue = scope.formInfo.cardNumberValue = uvalue = elm.inputmask("unmaskedvalue");
          ccType = scope.getCreditCardType(uvalue);
          // Let's make sure the card is valid
          if (ccType === undefined) {
            $(elm).addClass("ng-invalid shake");
            scope.formInfo.cardNumberValue = null;
            scope.ccType = false;
            $(elm).focus();
            return;
          }
          // Replace the value with the last four numbers of the card.
	  if ((ccType === "amex" && uvalue.length === 15) || (ccType !== "amex" && uvalue.length === 16)) {
            $("#card-expiration").focus();
            elm.val(uvalue.substr(uvalue.length - 4, uvalue.length));
          }
          // Once this function is fired, we need to add a "transitioning" class to credit
          // card element so that we can take advantage of our CSS animations.
          elm.addClass("transitioning-out");
          // We have to set a timeout so that we give our animations time to finish. We have to
	  // blur the element as well to fix a bug where our credit card field was losing its
	  // value prematurely.
	  setTimeout(function () {
            elm.removeClass("transitioning-out");
            elm.addClass("full");
	  }, scope.animationWait);
	  // After the credit card field is initially filled out, bind a click event
	  // that will allow us to edit the number again if we want to. We also bind
	  // a focus event (for mobile) and a keydown event in case of shift + tab
	  elm.unbind("blur focus click keydown keypress")
            .bind("focus click keydown keypress", function (e) {
              if (e.type === "focus" || e.type === "click" || (e.shiftKey && e.keyCode === 9)) {
                beginCreditCard(elm);
              }
            });
          if (window.navigator.standalone || !Modernizr.touch) {
            // Focus on the credit card expiration input.
            elm.val(scope.formInfo.cardNumberValue);
            $("#card-expiration").focus();
            elm.val(uvalue.substr(uvalue.length - 4, uvalue.length));
          }
	};
	beginCreditCard= function(elm) {
          elm.val(scope.formInfo.cardNumberValue);
          // Wait for the animation to complete and then remove our classes.

          elm.unbind("keypress blur")
            .bind("keypress blur", function (e) {
              // Is it the enter key?
              if (e.keyCode === 13 || e.type === "blur") {
                uvalue = elm.inputmask("unmaskedvalue");
                ccType = scope.getCreditCardType(uvalue);
                // Make sure the number length is valid
                if ((ccType === "amex" && uvalue.length === 15) || (ccType !== "amex" && uvalue.length === 16)) {
		    creditCardComplete();
                  //$('#card-expiration').focus();
                }
              }
            })
            .unbind("focus click keydown");
	};
	cardNo = elm.val();
	ccType = scope.getCreditCardType(cardNo);

	if (ccType === "amex") {
          elm.inputmask({ mask: "9999 999999 99999", placeholder: " ", oncomplete: creditCardComplete });
        } else {
          elm.inputmask({ mask: "9999 9999 9999 9999", placeholder: " ", oncomplete: creditCardComplete });
	}
        ctrl.$parsers.unshift(function(value){
          scope.type = scope.getCreditCardType(value);
          if (value) {
            scope.selectedCardType(scope.type);
	  }
          return value;
        });
      }
    }
    return directive
  });

  quickDonation.directive('submitButton', function() {
    return {
      restrict: 'A',
      scope: {
        loadingText: "@",
        enableButton: "="
      },
      link: function ($scope, ele) {
        var defaultSaveText = ele.html();
        ele.bind('click', function(){
          ele.attr('disabled','disabled');
          ele.html($scope.loadingText);
        });
      }
    };
  });

  quickDonation.directive('zipCodeInfo', function() {
    var directive = {
      require: 'ngModel',
      link: function($scope, elm, attrs, ctrl){
        var duration = 100;
        var elements = {
          country: $('#country'),
          state: $('#state'),
          city: $('#city')
        }
        elements.state.parent().hide();
        elements.city.parent().hide();

        elm.ziptastic().on('zipChange', function(evt, country, state, state_short, city, zip) {
          // State
          $('#state').val(state).parent().show(duration);
          $scope.formInfo.state = state;
          // City
          $('#city').val(city).parent().show(duration);
          $scope.formInfo.city = city;
        });
      },
    };
    return directive;
  });

  quickDonation.directive('radioLabel', function() {
    var directive = {
      link: function($scope, elm, attrs, ctrl){
        elm.bind('click', function(){
	    $scope.formInfo.donateAmount = null;
	    elm.parent().find('input').attr('checked', true);
          $scope.hidePriceVal = false;
	    $scope.formInfo.otherAmount = null;
	  $scope.formInfo.donateAmount = elm.parent().find('input').val();
	});
      },
    };
    return directive;
  });

})(angular, CRM.$, CRM._);
