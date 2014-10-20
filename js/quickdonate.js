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

   quickDonation.controller('QuickDonationCtrl', function($scope) {
     //manually binds Parsley--Validation Library to this form.
     $('#quickDonationForm').parsley();
     $scope.formInfo = {}; //property is set to bind input value
   });

   quickDonation.directive('zipCodeInfo', function() {
     var directive = {
       require: 'ngModel',
       link: function($scope, elm, attrs, ctrl){
         var duration = 500;
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
