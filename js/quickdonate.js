(function(angular, $, _) {
  var resourceUrl = CRM.resourceUrls['com.webaccessglobal.quickdonate'];
  var quickDonation = angular.module('quickdonate', ['ngRoute']);
  quickDonation.config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/donation', {
        templateUrl: resourceUrl + '/partials/quickdonate.html',
        controller: 'QuickDonationCtrl'
      });
      $routeProvider.when('/donation/:thanks', {
        templateUrl: resourceUrl + '/partials/thankYou.html',
        controller: 'QuickDonationCtrl'
      });
    }
  ]);

  quickDonation.factory('formFactory', function($q) {
    var savedData = {}
    return {
      getUser:function(contactID) {
        var deferred = $q.defer();
        var resultParams = null;
	if (contactID) {
          CRM.api3('Contact', 'get', {
            "sequential": 1,
            "id": contactID,
          }).success(function(data) {
            $.each( data.values, function( key, value ) {
              resultParams = value;
            });
            deferred.resolve(resultParams);
          }).error(function(data, status, headers, config) {
            deferred.reject("there was an error");
          });
	}
	return deferred.promise;
      },
      postData: function(param, isTest, creditInfo, amount) {
        var deferred = $q.defer();
        var resultParams = null;
        $.ajax({
          type: 'POST',
          url: "quick/contribute/transact",
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

  quickDonation.controller('QuickDonationCtrl', function($scope, formFactory, $route, $location) {
    //set donaiton page ID
    $scope.thanks = $route.current.params.thanks;
    $scope.currencySymbol = CRM.quickdonate.currency;
    $scope.paymentProcessor = CRM.quickdonate.paymentProcessor;
    $scope.donationConfig = CRM.quickdonate.config;
    $scope.priceListInfo = CRM.quickdonate.priceList;
    $scope.htmlPriceList = CRM.quickdonate.htmlPriceList;
    $scope.quickConfig = CRM.quickdonate.isQuickConfig;
    $scope.otherAmount = CRM.quickdonate.otherAmount;
    $scope.test = CRM.quickdonate.isTest;
    $scope.section = 1;

    //manually binds Parsley--Validation Library to this form.
    $('#quickDonationForm').parsley({
    excluded: "input[type=button], input[type=submit], input[type=reset], input[type=hidden], input:hidden"
    });
    $scope.formInfo = {}; //property is set to bind input value
    $scope.formInfo.email = formFactory.getEmail();
    $scope.formInfo.donateAmount = 0;

    //get session
    formFactory.getUser(CRM.quickdonate.sessionContact).then(function(resultParams) {
      if (resultParams) {
        $scope.formInfo.email = resultParams.email;
        $('#email').addClass('parsley-success');
        if (resultParams.first_name) {
          $scope.formInfo.user = resultParams.first_name +' '+ resultParams.last_name;
          $('#user').addClass('parsley-success');
        }
        if (resultParams.street_address) {
          $scope.formInfo.address = resultParams.street_address;
          $('#address').addClass('parsley-success');
        }
        if (resultParams.postal_code) {
          $scope.formInfo.zip = resultParams.postal_code;
          $('#zip').addClass('parsley-success');
          $scope.formInfo.city = resultParams.city;
          $scope.formInfo.state = $.map(CRM.quickdonate.allStates, function(obj, index) {
            if(obj == resultParams.state_province_id) {
              return index;
            }
          });
          $('#state').parent().show();
          $('#state').addClass('parsley-success');
          $('#city').parent().show();
          $('#city').addClass('parsley-success');
        }
      }
    });

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
    $scope.subtleAmount = 0;
    $scope.selectedAmount = 0;
    $scope.formInfo.selectDonateAmount = 0;
    $scope.formInfo.checkbxDonateAmount = 0;
    $scope.formInfo.textDonateAmount = 0;
    $scope.formInfo.CheckBoxAmount = 0;

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

    $scope.selectedRow = null;
    $scope.selectedCardType = function(row) {
      $scope.selectedRow = row;
      if (row) {
        $('.cardNumber').parent('div').parent('div').removeClass("ng-invalid shake");
        $('#invalidNumber').removeClass('help-block');
      }
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
    }


    $scope.saveData = function() {
      $scope.amount = $scope.formInfo.otherAmount || $scope.formInfo.donateAmount;
      $scope.state = CRM.quickdonate.allStates[$scope.formInfo.state];
      $scope.country = CRM.quickdonate.country;
      $scope.names = $scope.formInfo.user.split(' ');
      $scope.creditInfo = {};
      $('.donate-submit-btn').attr('disabled','disabled');
      $('.donate-submit-btn').html('Saving');
      $('.donate-submit-btn').addClass('loading');

      if ($scope.creditType) {
        $scope.expiry = $scope.formInfo.cardExpiry.split('/');
        $scope.month = $scope.expiry[0];
        $scope.year = $scope.expiry[1];
        $scope.ccType = true;
        $scope.creditInfo = {
          "credit_card_number": $scope.cardNumberValue,
          "cvv2": $scope.formInfo.securityCode,
          "credit_card_type": $scope.getCreditCardType($scope.cardNumberValue)
        };
      }
      if ($scope.directDebitType) {
        $scope.creditInfo = {
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
      $.extend($scope.param, $scope.formInfo, $scope.creditInfo);
      formFactory.postData($scope.param, $scope.isTest, $scope.creditInfo, $scope.amount).then(function(resultParams) {
        if (resultParams) {
          formFactory.setEmail($scope.formInfo.email);
          $location.path('/donation/thanks');
        }
      });
    };

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
      if (isDefault && !$scope.formInfo.payment_processor && !$scope.formInfo.is_pay_later) {
	$scope.formInfo.payment_processor = processorID;
        $scope.setPaymentBlock(processorID);
        return true;
      }
      return false;
    };

  });

  quickDonation.directive('creditCardExpiry', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        expirationComplete = function() {
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
        $(elm).inputmask({mask: "m/q", placeholder:" ", clearIncomplete: true, oncomplete: expirationComplete, showMaskOnHover: false, overrideFocus: true});
      }
    }
    return directive;
  });

  quickDonation.directive('validCreditBlock', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        elm.bind('keyup', function() {
          //check if all field are valid
          if (scope.quickDonationForm.zip.$valid && scope.quickDonationForm.securityCode.$valid && scope.quickDonationForm.cardExpiry.$valid) {
            $(elm).parent('div').parent('div').removeClass("blockInValid");
            $(elm).parent('div').parent('div').addClass("ng-valid blockIsValid");
          }
          else if ($(elm).parent('div').parent('div').hasClass('blockIsValid')) {
            $(elm).parent('div').parent('div').removeClass("ng-valid blockIsValid");
            $(elm).parent('div').parent('div').addClass("blockInValid");
            $('.errorBlock').addClass("help-block");
          }
        });
      }
    }
    return directive;
  });

  quickDonation.directive('securityCode', function() {
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
    return directive;
  });

  quickDonation.directive('creditCardType', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        scope.cardcomplete = false;

        creditCardComplete = function() {
          // We need to get the credit card field and the unmasked value of the field.
          scope.maskedVal = elm.val();
          scope.cardcomplete = true;
          scope.cardNumberValue = scope.formInfo.cardNumberValue = uvalue = elm.inputmask("unmaskedvalue");
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
	    $("#zipCode").show();
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
	  $("#zipCode").hide();
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

          if (value.length > 0 && value.length <= 1 && scope.type != undefined && scope.type !== "Amex") {
            elm.inputmask({ mask: "9999 9999 9999 9999", placeholder: " ", oncomplete: creditCardComplete,showMaskOnHover: false, overrideFocus: true});
            scope.quickDonationForm.cardNumber.$setValidity("minLength", false);
          }
          else if (value.length > 0 && value.length <= 2 && scope.type === "Amex") {
            elm.inputmask({ mask: "9999 999999 99999", placeholder: " ", oncomplete: creditCardComplete,showMaskOnHover: false,	overrideFocus: true });
            scope.quickDonationForm.cardNumber.$setValidity("minLength", false);
          }
          if (!scope.cardcomplete) {
            if (scope.type === 'Amex' && value.length < 16 && value.length > 2) {
              scope.quickDonationForm.cardNumber.$setValidity("minLength", false);
            }
            else if(value.length < 18 && value.length > 2) {
              scope.quickDonationForm.cardNumber.$setValidity("minLength", false);
            }
            else if(value.length > 2 ) {
              scope.quickDonationForm.cardNumber.$setValidity("minLength", true);
            }
          }
          else {
            scope.atype = scope.type = scope.getCreditCardType(scope.cardNumberValue);
            scope.selectedCardType(scope.type);
            scope.quickDonationForm.cardNumber.$setValidity("minLength", true);
          }
          return value;
        });
      }
    }
    return directive;
  });

  quickDonation.directive('submitButton', function() {
    return {
      //restrict: 'A',
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
          $('#state').addClass('parsley-success')
          // City
          $('#city').val(city).parent().show(duration);
          $('#city').addClass('parsley-success')
          $scope.formInfo.city = city;
        });
      },
    };
    return directive;
  });

  quickDonation.directive('radioLabel', function() {
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

  quickDonation.directive('hradioLabel', function() {
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

  quickDonation.directive('checkbxLabel', function() {
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
