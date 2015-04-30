(function(angular, $, _) {
  var resourceUrl = CRM.resourceUrls['com.webaccessglobal.simpledonate'];
  var simpleDonation = angular.module('simpledonate', ['ngRoute']);
  simpleDonation.config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/donation', {
        templateUrl: resourceUrl + '/partials/simpledonate.html',
        controller: 'SimpleDonationCtrl'
      });
      $routeProvider.when('/donation/:thanks', {
        templateUrl: resourceUrl + '/partials/thankYou.html',
        controller: 'SimpleDonationCtrl'
      });
    }
  ]);

  simpleDonation.factory('formFactory', function($q) {
    var savedData = {}
    return {
      postData: function(param, isTest, creditInfo, amount) {
        var deferred = $q.defer();
        var resultParams = null;
        var transactURL = CRM.url("civicrm/simple/contribute/transact");
        $.ajax({
          type: 'POST',
          url: transactURL,
          data: {
            params: param, isTest: isTest, creditInfo: creditInfo, amount: amount
          },
          dataType: 'json',
          success: function(data) {
            resultParams = data;
            deferred.resolve(resultParams);
          },
	  error: function(data) {
            deferred.reject("there was an error");
	  }
        });
        return deferred.promise;
      },
      setEmail: function(data) {
        savedData = data;
      },
      getEmail: function(data) {
        return savedData;
      },
     };
  });

  simpleDonation.controller('SimpleDonationCtrl', function($scope, formFactory, $route, $location, $window) {
    //set donaiton page ID
    $scope.thanks = $route.current.params.thanks;
    $scope.ziptasticIsEnabled = CRM.simpledonate.ziptasticEnable;
    $scope.countryList = CRM.simpledonate.countryList;
    $scope.stateList = CRM.simpledonate.stateList;
    $scope.currencySymbol = CRM.simpledonate.currency;
    $scope.paymentProcessor = CRM.simpledonate.paymentProcessor;
    $scope.donationConfig = CRM.simpledonate.config;
    $scope.priceListInfo = CRM.simpledonate.priceList;
    $scope.htmlPriceList = CRM.simpledonate.htmlPriceList;
    $scope.quickConfig = CRM.simpledonate.isQuickConfig;
    $scope.otherAmount = CRM.simpledonate.otherAmount;
    $scope.isTest = CRM.simpledonate.isTest;
    $scope.section = 1;
    $scope.values = CRM.simpledonateVal;

    //manually binds Parsley--Validation Library to this form.
    $('#simpleDonationForm').parsley({
    excluded: "input[type=button], input[type=submit], input[type=reset], input[type=hidden], input:hidden"
    });
    $scope.formInfo = {}; //property is set to bind input value

    $scope.formInfo.email = formFactory.getEmail();
    $scope.formInfo.donateAmount = 0;

    //get session
    if (CRM.simpledonate.sessionContact) {
      if ($scope.values.email) {
        $scope.formInfo.email = $scope.values.email;
        $('#email').addClass('parsley-success');
      }
      if ($scope.values.first_name) {
        $scope.formInfo.user = $scope.values.first_name +' '+ $scope.values.last_name;
        $('#user').addClass('parsley-success');
      }
      if ($scope.values.street_address) {
        $scope.formInfo.address = $scope.values.street_address;
        $('#address').addClass('parsley-success');
      }
      if ($scope.values.postal_code) {
        $scope.formInfo.zip = $scope.values.postal_code;
        $('#zip').addClass('parsley-success');
        if ($scope.ziptasticIsEnabled) {
          $.ziptastic($scope.values.postal_code, function(country, state, state_short, city, zip){
            $scope.formInfo.city = $scope.values.city;
            $('#city').parent().show();
            $('#city').addClass('parsley-success');
            $scope.formInfo.state = $.map(CRM.simpledonate.allStates, function(obj, index) {
              if(obj == $scope.values.state_province_id) {
                return index;
              }
            });
            $('#state').addClass('parsley-success');
            $('#state').parent().show();
          });
        }
        else {
          $scope.formInfo.country = $scope.values.country_id;
          $('#country').addClass('parsley-success');
          $scope.formInfo.stateList = $scope.values.state_province_id;
          $('#stateList').addClass('parsley-success');
          $('#state').parent().hide();
          $scope.formInfo.city = $scope.values.city;
          $('#city').parent().show();
          $('#city').addClass('parsley-success');
        }
      }
    }
    // if ziptastic disable hide and remove validation of country and stateList
    if ($scope.ziptasticIsEnabled) {
      $('#country').attr('data-parsley-required', 'false');
      $('#stateList').attr('data-parsley-required', 'false');
      $('#country').parent().hide();
      $('#stateList').parent().hide();
    }

    //Setting donation amount and message
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

    $scope.amountDefault = function(price, isDefault) {
      if (isDefault == 1 && !$scope.formInfo.donateAmount) {
        $scope.amount = $scope.formInfo.donateAmount = price;
        $scope.hidePriceVal = false;
        return $scope.amountActive(price);
      }
      return false;
    }

    //HTML PRICE SETS
    $scope.subtleAmount = 0; //Temporary calculated amount
    $scope.formInfo.selectDonateAmount = 0;
    $scope.formInfo.textDonateAmount = 0;
    $scope.formInfo.CheckBoxAmount = 0;
    //Calculate amount on amount selected
    $scope.calcAmount = function(amnt) {
      $scope.hidePriceVal = false;
      $scope.amount = parseInt($scope.amount) + parseInt(amnt);
    }

    $scope.hamountEnter = function(price,type) {
      $scope.subtleAmount = parseInt($scope.formInfo.donateAmount) + parseInt(price);
      if (type === 'radio' && $scope.formInfo.radioDonateAmount) {
        $scope.subtleAmount = parseInt($scope.formInfo.donateAmount) + parseInt(price) - parseInt($scope.formInfo.radioDonateAmount);
      }
      $scope.hidePriceVal = false;
    }

    $scope.hamountLeave = function(price,type) {
      if ($scope.formInfo.donateAmount != $scope.subtleAmount) {
        $scope.subtleAmount = parseInt($scope.subtleAmount) - parseInt(price);
        $scope.hidePriceVal = false;
      }
    }

    $scope.hamountClick = function(price, type, name) {
      if (price && type=='radio') {
        $scope.formInfo.radioDonateAmount = price;
      }
      $scope.subtleAmount = $scope.formInfo.donateAmount = $scope.amount = parseInt($scope.formInfo.CheckBoxAmount) + parseInt($scope.formInfo.selectDonateAmount) + parseInt($scope.formInfo.radioDonateAmount) + parseInt($scope.formInfo.textDonateAmount);
      $scope.hidePriceVal = false;
    }

    //Show blocks on next step button click
    $scope.sectionShow = function() {
      $scope.section = $scope.section + 1;
    };

    $scope.selectedSection = function(sectionNo) {
      return sectionNo <= $scope.section ;
    };

    //Show card icon for selected type
    $scope.selectedRow = null;
    $scope.selectedCardType = function(row) {
      $scope.selectedRow = row;
      if (row) {
        $('.cardNumber').parent('div').parent('div').removeClass("ng-invalid shake");
        $('#invalidNumber').removeClass('help-block');
      }
    };

    //Credit card regexp
    ccDefinitions = {
      'Visa': /^4/,
      'MasterCard': /^5[1-5]/,
      'Amex': /^3(4|7)/,
      'Discover': /^6011/
    };

    //Get credit card type for given value
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

    //Set payment block depending on payment processor selection
    $scope.creditType = false;
    $scope.directDebitType = false;
    $scope.hiddenProcessor = false;
    $scope.setPaymentBlock = function(value) {
      $scope.creditType = false;
      $scope.directDebitType = false;
      $scope.hiddenProcessor = false;
      $scope.payLater = false;

      if (value == 'payLater') {
        $scope.payLater = true;
        $scope.formInfo.payment_processor = 0
      }
      else {
        $scope.formInfo.is_pay_later = 0;
        $billingmodeform = 1;//billing-mode-form = 1
	//billing-mode-button = 2
	//billing-mode-notify = 4
	//payment-type-credit-card = 1
	//payemt-type-direct-debit = 2
	if($scope.paymentProcessor[value]['billing_mode'] & $billingmodeform /*billing_mode_form*/) {
	  if($scope.paymentProcessor[value]['payment_type'] == 1) {
	    $scope.creditType = true;
	  }
	  else if($scope.paymentProcessor[value]['payment_type'] == 2) {
	    $scope.directDebitType = true;
	  }
	}
	else {
	  $scope.hiddenProcessor = true;
	}
      }
    };

    $scope.processorDefault= function(processorID, isDefault){
      if (isDefault==1 && !$scope.formInfo.payment_processor && !$scope.formInfo.is_pay_later) {
	$scope.formInfo.payment_processor = processorID;
        $scope.setPaymentBlock(processorID);
        return true;
      }
      return false;
    };

    //Submit form data
    $scope.saveData = function() {
      $scope.amount = $scope.formInfo.otherAmount || $scope.formInfo.donateAmount;
      $scope.state = $scope.ziptasticIsEnabled ? CRM.simpledonate.allStates[$scope.formInfo.state] : $scope.formInfo.stateList ;
      $scope.country = $scope.ziptasticIsEnabled ? CRM.simpledonate.country : $scope.formInfo.country;
      if ($scope.formInfo.use) {
        $scope.names = $scope.formInfo.user.split(' ');
      }
      $scope.creditInfo = {};
      $('.donate-submit-btn').attr('disabled','disabled');
      $('.donate-submit-btn').html('Saving');
      $('.donate-submit-btn').addClass('loading');
      if ($scope.creditType) {
        $scope.ccType = true;
        $scope.creditInfo = {
          "creditType": true,
          "credit_card_number": $scope.formInfo.ccNumber,
          "cvv2": $scope.formInfo.securityCode,
          "credit_card_type": $scope.getCreditCardType($scope.formInfo.ccNumber)
        };
      }
      if ($scope.directDebitType) {
        $scope.creditInfo = {
          "debitType": true,
          "bank_identification_number": $scope.formInfo.bankID,
          "bank_name": $scope.formInfo.bankName,
          "account_holder": $scope.formInfo.accountHolder,
          "payment_type": 2,
          "bank_account_number": $scope.formInfo.bankAccountNumber
        };
      }

      $scope.param = {
        "state" : $scope.state,
        "country": $scope.country,
        "amount": $scope.amount
      };
      $formParams ={};
      $.extend($formParams,$scope.formInfo);
      delete $formParams.state;
      delete $formParams.country;
      delete $formParams.amount;
      $.extend($scope.param, $formParams, $scope.creditInfo);
      //Show thank you page on data submission
      formFactory.postData($scope.param, $scope.isTest, $scope.creditInfo, $scope.amount).then(function(resultParams) {
        if (resultParams.cardExpiryError) {
          $('.donate-submit-btn').removeAttr('disabled');
          $('.donate-submit-btn').html('Complete Donation <span class="icon next-icons"></span>');
          if ($scope.creditType) {
            $scope.simpleDonationForm.cardExpiry.$setValidity("required", false);
            if ($scope.simpleDonationForm.cardNumber.$pristine || $scope.simpleDonationForm.cardNumber.$invalid || $scope.simpleDonationForm.cardExpiry.$invalid || $scope.simpleDonationForm.securityCode.$invalid) {
              $('.errorBlock ul').hide();
              $('.cardNumber').parent('div').parent('div').removeClass("blockIsValid");
              $('.cardNumber').parent('div').parent('div').addClass("blockInValid");
              $('.errorBlock').addClass("help-block");
            }
          }
        }
        else if (resultParams.error){
          CRM.alert(resultParams.error);
          $window.location.reload();
        }
        else if (resultParams) {
          formFactory.setEmail($scope.formInfo.email);
          $location.path('/donation/thanks');
          $window.scrollTo(0,0)
        }
      });
    };
  });

  simpleDonation.directive('creditCardExpiry', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        elm.bind('keydown', function(e) {
          if (e.keyCode === 8) {
            scope.simpleDonationForm.cardExpiry.$setValidity("minlength", false);
          }
        });
        expirationComplete = function() {
          scope.formInfo.cardExpiry = elm.inputmask("unmaskedvalue");
          elm.addClass("full").unbind("blur").bind("keydown", function (e) {
            if (e.keyCode === 8 && $(this).val() === "") {
              $(this).removeClass("full");
              if (window.navigator.standalone || !Modernizr.touch) {
                $("#cardNumber").focus();
              }
            }
          });
          setTimeout(function () {
            $("#securityCode").focus();
          }, 220);
        }
        $(elm).inputmask({mask: "m/q", placeholder: " ", clearIncomplete: true, oncomplete: expirationComplete, showMaskOnHover: false, overrideFocus: true});
      }
    }
    return directive;
  });

  simpleDonation.directive('validCreditBlock', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        elm.bind('keyup', function() {
          //check if all field are valid
          if (scope.simpleDonationForm.securityCode.$valid && scope.simpleDonationForm.cardExpiry.$valid) {
            $(elm).parent('div').parent('div').removeClass("blockInValid");
            $(elm).parent('div').parent('div').addClass("blockIsValid");
          }
          else if ($(elm).parent('div').parent('div').hasClass('blockIsValid')) {
            $(elm).parent('div').parent('div').removeClass("blockIsValid");
            $(elm).parent('div').parent('div').addClass("blockInValid");
            $('.errorBlock').addClass("help-block");
          }
        });
      }
    }
    return directive;
  });

  simpleDonation.directive('checkStateValid', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        $('#country').bind('change', function() {
          //remove stateList validation on change of country
          if (elm.val()) {
            $('#stateList').addClass("parsley-success");
          }
          else {
            $('#stateList').removeClass("parsley-success");
          }
        });
      }
    }
    return directive;
  });

  simpleDonation.directive('creditCardType', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        scope.cardcomplete = false;

        creditCardComplete = function() {
          // We need to get the credit card field and the unmasked value of the field.
          scope.maskedVal = elm.val();
          scope.cardcomplete = true;
          scope.formInfo.ccNumber = scope.cardNumberValue = scope.formInfo.cardNumberValue = uvalue = elm.inputmask("unmaskedvalue");
          ccType = scope.getCreditCardType(uvalue);
          // Let's make sure the card is valid
          if (ccType === undefined) {
            $(elm).addClass("ng-invalid invalid shake");
            $(elm).parent('div').parent('div').addClass("ng-invalid shake");
            $('#invalidNumber').addClass("help-block");
            scope.formInfo.cardNumberValue = null;
            scope.ccType = false;
            scope.cardcomplete = false;
            $(elm).focus();
            return;
          }
          // Replace the value with the last four numbers of the card.
          elm.bind("saveValues", function () {
	    if ((ccType === "Amex" && uvalue.length === 15) || (ccType !== "Amex" && uvalue.length === 16)) {
              scope.cardcomplete = true;
              elm.data("ccNumber", uvalue).val(uvalue.substr(uvalue.length - 4, uvalue.length));
            }
          });
          // Once this function is fired, we need to add a "transitioning" class to credit
          // card element so that we can take advantage of our CSS animations.
          elm.addClass("transitioning-out");
          setTimeout(function () {
            elm.removeClass("transitioning-out");
            elm.bind("blur", function () {
              elm.trigger("saveValues");
            }).blur();
            elm.addClass("full");
          }, 600);
          // We have to set a timeout so that we give our animations time to finish. We have to
	  // blur the element as well to fix a bug where our credit card field was losing its
	  // value prematurely.

	  setTimeout(function () {
	    $("#card-expiration").show();
	    $("#securityCode").show();
	  }, 150);

	  // After the credit card field is initially filled out, bind a click event
	  // that will allow us to edit the number again if we want to. We also bind
	  // a focus event (for mobile) and a keydown event in case of shift + tab
          elm.unbind("focus click keydown keypress keyup")
	    .bind("focus click keydown keyup", function (e) {
              if (e.type === "focus" || e.type === "click" || (e.shiftKey && e.keyCode === 9)) {
                beginCreditCard(elm);
              }
            });

          if (window.navigator.standalone || !Modernizr.touch) {
            // Focus on the credit card expiration input.
            elm.data("ccNumber", uvalue).val(uvalue.substr(uvalue.length - 4, uvalue.length));
            $("#card-expiration").show().focus();
	  }
	};
	beginCreditCard= function(elms) {
          elms.val(elm.data("ccNumber")).addClass("transitioning-in");
          scope.cardcomplete = false;

          // Wait for the animation to complete and then remove our classes.
          setTimeout(function () {
            elms.removeClass("transitioning-in full");
          }, 600);

          elms.unbind("keyup blur")
            .bind("keyup blur", function (e) {
              uvalues = elms.inputmask("unmaskedvalue");
              if (e.keyCode === 13 || e.type === "blur" || (e.type==="keyup" && e.key !== "Backspace" && uvalues.length >= 15)) {
                uvalue = elm.inputmask("unmaskedvalue");
                ccType = scope.getCreditCardType(uvalue);
                // Make sure the number length is valid
                if ((ccType === "Amex" && uvalue.length === 15) || (ccType !== "Amex" && uvalue.length === 16)) {
		  creditCardComplete();

                }
              }
            })
            .unbind("focus click keydown");
	    maskValues();
	};

	maskValues = function() {
	  $("#card-expiration").hide();
	  $("#securityCode").hide();
	};
        maskValues();
        scope.$watch('cardcomplete',function(newvalue,oldvalue){
          if (newvalue) {
            $('#card-expiration').show().trigger('click');
          }
        });
        ctrl.$parsers.unshift(function(value){
          scope.atype = scope.type = scope.getCreditCardType(value);
          if (value) {
            scope.selectedCardType(scope.type);
          }

          if (value.length==2 && (scope.type != undefined && scope.type !== "Amex")) {
            elm.inputmask({ mask: "9999 9999 9999 9999", placeholder: " ", oncomplete: creditCardComplete,showMaskOnHover: false, overrideFocus: true});
            scope.simpleDonationForm.cardNumber.$setValidity("minLength", false);
          }
          else if (scope.type === "Amex" && value.length==3) {
            elm.inputmask({ mask: "9999 999999 99999", placeholder: " ", oncomplete: creditCardComplete, showMaskOnHover: false,overrideFocus: true });
            scope.simpleDonationForm.cardNumber.$setValidity("minLength", false);
          }
          else if (scope.type === undefined && value.length==3) {
            elm.inputmask({ mask: "9999 9999 9999 9999", placeholder: " ", oncomplete: creditCardComplete,showMaskOnHover: false, overrideFocus: true});
            scope.simpleDonationForm.cardNumber.$setValidity("minLength", false);
          }
          else if (elm.inputmask("hasMaskedValue") && scope.type === undefined && value.length ==0) {
            elm.unbind(".inputmask");
          }

          if (scope.type === undefined || value.length==1) {
            scope.simpleDonationForm.cardNumber.$setValidity("minLength", false);
          }

          if (!scope.cardcomplete) {
            if (scope.type === 'Amex' && value.length < 16 && value.length > 2) {
              scope.simpleDonationForm.cardNumber.$setValidity("minLength", false);
            }
            else if(value.length < 18 && value.length > 2) {
              scope.simpleDonationForm.cardNumber.$setValidity("minLength", false);
            }
            else if(value.length > 2) {
              scope.simpleDonationForm.cardNumber.$setValidity("minLength", true);
            }
          }
          else {
            scope.atype = scope.type = scope.getCreditCardType(scope.cardNumberValue);
            scope.selectedCardType(scope.type);
            scope.simpleDonationForm.cardNumber.$setValidity("minLength", true);
          }
          return value;
        });
      }
    }
    return directive;
  });

  simpleDonation.directive('submitButton', function() {
    return {
      scope: {
        loadingText: "@",
        enableButton: "="
      },
      link: function ($scope, ele) {
        var defaultSaveText = ele.html();
        ele.on('click', function(){
          ele.attr('disabled','disabled');
          ele.addClass('loading');
          ele.html($scope.loadingText);
        });
      }
    };
  });

  simpleDonation.directive('zipCodeInfo', function() {
    var directive = {
      require: 'ngModel',
      link: function($scope, elm, attrs, ctrl){
        if ($scope.ziptasticIsEnabled) {
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
            $('#state').addClass('parsley-success')
            // City
            $('#city').val(city).parent().show(duration);
            $('#city').addClass('parsley-success')
            $scope.formInfo.city = city;
          });
        }
        else {
          $('#state').parent().hide();
        }
      },
    };
    return directive;
  });

  simpleDonation.directive('radioLabel', function() {
    var directive = {
      link: function($scope, elm, attrs, ctrl) {
        elm.bind('click change', function(e) {
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

  simpleDonation.directive('hradioLabel', function() {
    var directive = {
      link: function($scope, elm, attrs, ctrl) {
        elm.bind('click', function(e) {
          if (elm.parent().find('input:checked').length) {
            $(this).parent().parent().parent().find('label').removeClass('active');
            $(this).addClass('active');
          }
        });
      },
    };
    return directive;
  });

  simpleDonation.directive('checkbxLabel', function() {
    var directive = {
      link: function($scope, elm, attrs, ctrl) {
        elm.bind('click', function(e) {
          $scope.hidePriceVal = false;
          if (!elm.parent().find('input:checked').length) {
            elm.parent().find('input').attr('checked', true);
            $(this).addClass('active');
            $scope.formInfo.CheckBoxAmount = parseInt($scope.formInfo.CheckBoxAmount) + parseInt(elm.parent().find('input').val());
            $scope.subtleAmount = $scope.formInfo.donateAmount = parseInt($scope.formInfo.donateAmount) + parseInt(elm.parent().find('input').val());
          }
          else if (elm.parent().find('input:checked').length) {
            elm.parent().find('input').attr('checked', false);
            elm.parent().find('input').trigger('click');
            $(this).removeClass('active');
            $scope.formInfo.CheckBoxAmount = parseInt($scope.formInfo.CheckBoxAmount) - parseInt(elm.parent().find('input').val());
            $scope.subtleAmount = $scope.formInfo.donateAmount = parseInt($scope.formInfo.donateAmount) - parseInt(elm.parent().find('input').val());
          }
	});
      },
    };
    return directive;
  });
})(angular, CRM.$, CRM._);
