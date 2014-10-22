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
    return{
      getUser:function(contactID){
        var deferred = $q.defer();
        CRM.api3('Contact', 'get', {
          "sequential": 1,
          "id": contactID
        }).done(function(data) {
          cj.each( data.values, function( key, value ) {
            resultParams = value;
          });
          deferred.resolve(resultParams);
        }).error(function(data, status, headers, config){
          deferred.reject("there was an error");
        });
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

    $scope.section = 1;
    //manually binds Parsley--Validation Library to this form.
    $('#quickDonationForm').parsley();
    $scope.formInfo = {}; //property is set to bind input value

    $scope.amountActive = function(price) {
      return $scope.amount === price;
    }

    $scope.hidePriceVal = true;
    $scope.amountSelected = function(price) {
      $scope.amount = price;
    }

    $scope.amounthover = function(price) {
      $scope.message = price;
      $scope.hidePriceVal = false;
      return $scope.message;
    }

    $scope.amountInput = function() {
	  $scope.message = $scope.formInfo.otherAmount;
	  $scope.hidePriceVal = false;
	  return $scope.message;
	}

	$scope.amountActive = function(price) {
     return $scope.amount === price;
    }

    $scope.selectedCardType = function(row) {
      $scope.selectedRow = row;
    };

    $scope.sectionShow = function() {
      $scope.section = $scope.section + 1;
    };

    $scope.selectedSection = function(sectionNo) {
      return sectionNo <= $scope.section ;
    };

    $scope.createContribution = function (contactId,params) {
      //get contribution page
      var resultParams =$scope.donationConfig;//<?php echo json_encode($contributionPage);?>;
      $scope.amount = $scope.formInfo.otherAmount || $scope.formInfo.donateAmount || 1;
      $scope.contributionparams = {
        "credit_card_number":$scope.formInfo.cardNumber,
        "cvv2":$scope.formInfo.securityCode,
        "credit_card_type":"Visa",
        "billing_first_name":params.first_name,
        "first_name":params.first_name,
        "billing_middle_name":params.middle_name,
        "middle_name":params.middle_name,
        "billing_last_name":params.last_name,
        "last_name":params.last_name,
        "billing_street_address-5":params.street_address,
        "street_address":params.street_address,
        "billing_city-5":params.city,
        "city":params.city,
        "billing_country_id-5":params.country_id,
        "country_id":params.country_id,
        "billing_state_province_id-5":params.state_province_id,
        "state_province_id":params.state_province_id,
        "billing_postal_code-5":params.postal_code,
        "postal_code":params.postal_code,
        //"year":$scope.year,
        //"month":$scope.month,
        "email":params.email,
        "contribution_page_id":resultParams.id,
        "payment_processor_id":$scope.formInfo.payment_processor,
        "is_test":1,
        "total_amount":$scope.amount,
        "financial_type_id":resultParams.financial_type_id,
        "currencyID":resultParams.currency,
        "currency":resultParams.currency,
        "skipLineItem":0,
        "skipRecentView":1,
        "contact_id":contactId,
        "address_id":params.address_id,
        "source":"Online Contribution: Help Support CiviCRM!",
      };

      CRM.api3('Contribution', 'transact', $scope.contributionparams ).success(function(data, status, headers, config) {
          if (data.is_error == 0) {
	      alert('ok');
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
        'street_address': $scope.formInfo.address,
        'city': $scope.formInfo.city,
        //'state_province_id': $scope.formInfo.state.key,
        'postal_code': $scope.formInfo.zip,
        'name': $scope.user,
        'is_billing': 1,
        'is_primary': 0,
        'api.Address.update':{'id':addressID, 'contact_id': $scope.contact_id, 'is_billing':1,'street_address':$scope.formInfo.address,'city':$scope.formInfo.city,'postal_code':$scope.formInfo.zip},
      });
      formFactory.getUser(contactId).then(function(resultParams) {
        $scope.createContribution(contactId,resultParams);
      });
    }
    $scope.newUserContri = function(contactId) {
      primaryValue = [0,1];contactID = ['null',contactId];
      cj.each( primaryValue, function( key, value ) {
        CRM.api3('Address', 'create', {
           'contact_id':contactID[key] ,
           'location_type_id':5,
           'street_address':$scope.formInfo.address,
           'city':$scope.formInfo.city,
           //'state_province_id':$scope.formInfo.state.key,
           'postal_code':$scope.formInfo.postalCode,
           'name':$scope.formInfo.user,
           'is_billing':1,
           'is_primary':primaryValue[key]
        });
      });
      formFactory.getUser(contactId).then(function(resultParams) {
        $scope.createContribution(contactId,resultParams);
      });
    };

    $scope.saveData = function() {
      $scope.amount = $scope.formInfo.otherAmount || $scope.formInfo.donateAmount;
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
        $(elm).inputmask({mask: "m/q", placeholder: " "});
        elm.bind('keyup', function() {
          if (scope.quickDonationForm.cardExpiry.$valid && elm.val().length==5) {
            $('#securityCode').focus();
	  }
        });
      }
    }
    return directive
  });

  quickDonation.directive('securityCode', function(){
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        elm.bind('keyup', function(){
          if (scope.quickDonationForm.securityCode.$valid) {
            $('#zip').focus();
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
        scope.cardNumberValue = null;
        $(elm).inputmask({ mask: "9999 9999 9999 9999", placeholder: " "});

        elm.bind('keyup', function(){
	  if (scope.quickDonationForm.cardNumber.$valid) {
            if (scope.type) {
              $('#card-expiration').focus();
            }
	  }
        });
        elm.bind('blur', function(){
	  var val = elm.val();
	  scope.cardNumberValue = val;
	  elm.val(val.substr(val.length - 4));
	});
        elm.bind('click', function(){
	    elm.val(scope.cardNumberValue);
	});

        ctrl.$parsers.unshift(function(value){
          scope.type =
            (/^5[1-5]/.test(value)) ? "mastercard"
            : (/^4/.test(value)) ? "visa"
            : (/^3[4|7]/.test(value)) ? 'amex'
            : (/^6011|65|64[4-9]|622(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5]))/.test(value)) ? 'discover'
            : undefined
            ctrl.$setValidity('invalid',!!scope.type);
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
          elements.state.val(state).parent().show(duration);
          // City
          elements.city.val(city).parent().show(duration);
        });
      },
    };
    return directive;
  });

})(angular, CRM.$, CRM._);
