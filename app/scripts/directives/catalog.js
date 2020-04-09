'use strict';

angular.module('angularApp').directive('bkCatalog', ['$http', 'config', 'authorization', '$location', function($http, config, authorization, $location) {
  return {
    restrict: 'E',
    templateUrl: 'views/bk_catalog.html',
    link: function(scope, element, attributes){
      scope.$watch('searching', function () {
        var filter = ''
        if (!scope.searching){
          return;
        }
        if (scope.group !== undefined) {
          filter += "&group=" + scope.group;
        }
        if (scope.priceSliderValue !== undefined) {
          filter += "&priceFrom=" + scope.priceSliderValue[0];
          filter += "&priceTo=" + scope.priceSliderValue[1];
        }
        if (scope.filterAuthors !== undefined) {
          filter += "&author=" + scope.filterAuthors;
        }
        if (scope.filterSeries !== undefined) {
          filter += "&series=" + scope.filterSeries;
        }
        if (scope.filterCovers !== undefined) {
          filter += "&cover=" + scope.filterCovers;
        }
        if (scope.filterLanguages !== undefined) {
          filter += "&language=" + scope.filterLanguages;
        }
        if (scope.filterTranslators !== undefined) {
          filter += "&translator=" + scope.filterTranslators;
        }
        if (scope.filterEditors !== undefined) {
          filter += "&editor=" + scope.filterEditors;
        }
        if (scope.filterPainters !== undefined) {
          filter += "&painter=" + scope.filterPainters;
        }
        if (scope.filterIllustrations !== undefined) {
          filter += "&illustrations=" + scope.filterIllustrations;
        }
        if (scope.filterAgeGroups !== undefined) {
          filter += "&ageGroup=" + scope.filterAgeGroups;
        }
        if (scope.filterElBookExist !== undefined) {
          filter += "&elBookExist=" + scope.filterElBookExist;
        }
        if (scope.filterSortBy !== undefined) {
          filter += "&sortBy=" + scope.filterSortBy;
        }
        var page = scope.page;
        $http.get(config.url() + "/api/books/search?page=" + (page - 1) + filter)
          .success(function(response) {
            var bookList = response.bookList;
            for (var key in bookList) {
              if (bookList[key].image == '') {
                bookList[key].image = '/img/no_picture_ru_165.jpg';
              }
            }
            scope.books = bookList;
            scope.goodsCount = response.countInList;
            scope.pages = [];
            var pagesCount = Math.ceil(scope.goodsCount / 42);
            var startPage = 1;
            if (page <= 4) {
              startPage = 1;
            }else{
              startPage = page - 4;
            }
            var endPage = 10;
            if (pagesCount > 10) {
              if (page > 5){
                if ((page + 4) > pagesCount) {
                  endPage = pagesCount;
                }else{
                  endPage = page + 4;
                }
              }else{
                endPage = 10;
              }
            }else{
              endPage = pagesCount;
            }
            for(var i = startPage; i <= endPage; i++){
              var active = false;
              if (page == i) {
                active = true;
              }
              scope.pages.push({page: i, url: "/catalog?page=" + i, active: active})
            }
            var pagePrevious = page > 2 ? page - 1: 1;
            var pageNext = page < pagesCount ? page + 1: pagesCount;
            scope.pagePrevious = pagePrevious;
            scope.pageNext =  pageNext;
            scope.searching = false;
          })
      })
    }
  };
}])
