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
      getpriceList:function() {
        var holdPriceList = $q.defer();
        var priceList= [];
        var contributionId;

        //get priceSetId and Amount List
        CRM.api3('PriceField', 'get', {
          "sequential": 1,
          "price_set_id": CRM.quickdonate.priceSetID,
        }).done(function(fieldVal) {
          $.each(fieldVal.values, function(fieldKey, fieldVal) {
            CRM.api3('PriceFieldValue', 'get', {
              "sequential": 1,
              "price_field_id": fieldVal.id,
            }).done(function(amtList) {
              $.each(amtList.values, function(amtKey, amtVal) {
                priceList.push(amtVal);
              });
              holdPriceList.resolve(priceList);
            });
          });
        });
        return holdPriceList.promise;
      },
    };
  });

  quickDonation.controller('QuickDonationCtrl', function($scope, formFactory) {
    //set donaiton page ID
    $scope.donationID = CRM.quickdonate.donatePageID;

    //manually binds Parsley--Validation Library to this form.
    $('#quickDonationForm').parsley();
    $scope.formInfo = {}; //property is set to bind input value

    formFactory.getpriceList().then(function(data) {
      $scope.priceListInfo = data;
    });

    $scope.hidePriceVal=true;
    $scope.amountSelected = function(price) {
      $scope.amount = price;
    }

    $scope.amounthover = function(price) {
      $scope.message = price;
      $scope.hidePriceVal = false;
      return $scope.message;
    }
      $scope.showInput = false;

    $scope.selectedCardType = function(row) {
      $scope.selectedRow = row;
    };

    $scope.section = 1;
    $scope.sectionShow = function() {
      $scope.section = $scope.section + 1;
    };
    $scope.selectedSection = function(sectionS) {
      return sectionS <= $scope.section ;
    };


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
        "api.Contribution.create":{ "financial_type_id": 1,"total_amount": $scope.amount,"contact_id": contactId,"payment_instrument_id": 1,"address_id":'$value.id','net_amount':$scope.amount }
      }).success(function(data, status, headers, config) {
        alert('DONE11111111!!');
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
       CRM.api3('Contribution', 'create', {"financial_type_id": 1,"total_amount": 100,"contact_id": contactId,"payment_instrument_id": 1,"address_id":resultParams.address_id,'net_amount': 100}).success(function(data, status, headers, config) {
          alert('DONE22222222!!');
        });
      });
    }

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
    }
  });

  quickDonation.directive('creditCardExpiry', function(){
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        $(elm).inputmask({mask: "m/q"});
      }
    }
    return directive
  });

  quickDonation.directive('creditCardType', function(){
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        $(elm).inputmask({ mask: "9999 9999 9999 9999"});

        ctrl.$parsers.unshift(function(value){
          scope.type =
            (/^5[1-5]/.test(value)) ? "mastercard"
            : (/^4/.test(value)) ? "visa"
            : (/^3[47]/.test(value)) ? 'amex'
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
