/**
 * Created by sergey on 15.02.17.
 */

'use strict';

angular.module('angularApp')
  .controller('OrdersCtrl', function($scope, $http, $location, $route, config, authorization, utils, $rootScope, order) {
    $scope.username = authorization.username();
    $scope.orderStates = ['Робиться', 'Зроблений', 'Підтверджено', 'Зібраний', 'Сплачений'];
    $scope.orderStatesFilter = ['Всі', 'Робиться', 'Зроблений', 'Підтверджено', 'Зібраний', 'Сплачений'];
    $scope.selectors = {};
    $scope.selectors.orderStateFilter = 'Всі';
    $scope.dateEnd = new Date(new Date().getTime() + 1 * 1000 * 60 * 60 * 24); //taking tomorrow date for covering current day
    $scope.dateStart = new Date($scope.dateEnd - 10 * 1000 * 60 * 60 * 24);
    $scope.orderNumber = undefined;

    $rootScope.$on('successful_authorization', function () {
      $scope.username = authorization.username();
    })

    $scope.editItem = function (item) {
      item.editing = true;
      $scope.selectors.orderState = item.orderState;
      $scope.selectors.admComment = item.admComment;
      angular.forEach($scope.orderPayments, function (payment, key) {
         if (payment.id === item.payment.id){
           $scope.selectors.payment = payment;
         }
      })
    }

    $scope.doneEditing = function (item) {
      item.orderState = $scope.selectors.orderState;
      item.admComment = $scope.selectors.admComment;
      item.payment = $scope.selectors.payment;
      item.saving = true;
      $http.post(config.url() + "/api/orders_admin/orders/update", item, {withCredentials: true})
        .success(function(response) {
           item.saving = false;
           item.editing = false;
           item.savedSuccess = true;
           item.savedError = false;
           $scope.currentOrder = response;
        })
        .error(function () {
           item.saving = false;
           item.savedSuccess = false;
           item.savedError = true;
        });
    }

    $scope.updateOrdersTable = function () {
      var link = '';
      var dateStart, dateEnd;
      $scope.saving = true;
      $scope.styleOrdersList = {opacity: 0.2};
      dateStart = $scope.dateStart.getDate().toString() + "." + ("0" +($scope.dateStart.getMonth() + 1).toString()).slice(-2) + "." + $scope.dateStart.getFullYear().toString();
      dateEnd = $scope.dateEnd.getDate().toString() + "." + ("0" +($scope.dateEnd.getMonth() + 1).toString()).slice(-2) + "." + $scope.dateEnd.getFullYear().toString();

      if ($scope.orderNumber) {
        link += "&OrderNumber=" + $scope.orderNumber;
      }else{
        if ($scope.dateStart && $scope.dateEnd) {
          link = "dateStart=" + dateStart + "&dateEnd=" + dateEnd;
        }
        if ($scope.selectors.orderStateFilter && $scope.selectors.orderStateFilter != 'Всі') {
          link += "&OrderState=" + $scope.selectors.orderStateFilter;
        }
      }

      $http.get(config.url() + "/api/orders_admin/orders?" + link, {withCredentials: true})
        .success(function (response) {
          $scope.orders = undefined;
          $scope.grandTotal = 0;
          for(var k in response) {
            var grandTotal = 0;
            angular.forEach(response, function (value, key) {
              grandTotal += value.totalAmount;
            });
            $scope.orders = response;
            $scope.grandTotal = grandTotal;
          };
          $scope.styleOrdersList = {opacity: 1};
          $scope.saving = false;
        })
      $http.get(config.url() + "/api/get_payment_types")
        .success(function (response) {
           $scope.orderPayments = response;
        })
    }

    $scope.updateOrdersTable();

    $scope.RecalculationOrder = function (orderForChange) {
      orderForChange.payment = $scope.selectors.payment;
      order.RecalculateOrder(orderForChange);
      order.RecalculateDeliveryCost(orderForChange);
    }

    $scope.toDateTime = function(ObjId) {
      return utils.toDateTime(ObjId);
    }

    $scope.fromUnixTime = function(UnixTime) {
      return utils.fromUnixTime(UnixTime);
    }

    $scope.setGoodsTable = function (order){
      angular.forEach($scope.orders, function (value, key) {
        if(value.number === order.number){
           value.active = (value.active === undefined)? true : !value.active;
        }else{
           value.active = false;
        }
      });
      //$scope.goodsTable = order.goodsTable;
      $scope.currentOrder = order;
      $http.get(config.url() + "/api/get_city?originalId=" + order.cityId)
        .success(function(response) {
          $scope.selectedCity = response;
        })
      $http.get(config.url() + "/api/check_user_exist?email=" + order.email)
        .then(function successCallback(response) {
          if (response.data){
            order.userNowExist = true;
          }else{
            order.userNowExist = false;
          }
        }, function errorCallback(response) {
          order.userNowExist = false;
        })
    }

  });
