/**
 * Created by Desster on 17.12.2015.
 */
'use strict';

angular.module('angularApp')
  .controller('BookViewCtrl', function ($scope, $http, $window, $location, authorization, FileUploader, config) {
    var code = $location.search().code;
    $scope.gallery = {images: [], opts: "", show: false};
    $scope.cropSelection = {src:"", selection: [], thumbnail: false};

    $scope.uploader = new FileUploader({
      url: config.url() + '/api/edit/books/banner_upload',
      removeAfterUpload: true,
      withCredentials: true
    });
    var uploader = $scope.uploader;
    uploader.filters.push({
      name: 'imageFilter',
      fn: function(item /*{File|FileLikeObject}*/, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    $scope.editItem = function (item) {
      item.editing = true;
    }

    $scope.saveItem = function (item) {
      item.editing = false;
      item.upl_item.formData[0].rectangle = [$scope.cropSelection.selection[0],
                                             $scope.cropSelection.selection[1],
                                             $scope.cropSelection.selection[4],
                                             $scope.cropSelection.selection[5]];
      item.upl_item.upload();
    }

    uploader.onAfterAddingFile = function(fileItem) {
       $scope.book.upl_item = fileItem;
    };

    uploader.onSuccessItem = function(fileItem, response, status, headers) {
       $scope.bannerImage = response.image;
       $scope.book.upl_item = null;
    };

    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
      alert("Ошибка добавления файла, разрешены только изображения");
    };

    uploader.onErrorItem = function(fileItem, response, status, headers) {
      $scope.book.upl_item = null;
      alert("При загрузке файла на сервер возникла ошибка");
    };

    $http.get(config.url() + '/api/books/search?code=' + code)
      .success(function (response) {
        $scope.book = response.bookList[0];
        if ($scope.book.image === '') {
          $scope.book.image = '/img/no_picture_ru_165.jpg';
        } else {
          $scope.book.image = '/img/pics/' + $scope.book.code + '_big.jpg';
        };
      })

    $http.get(config.url() + '/api/books/images_without_main?code=' + code)
      .success(function (response) {
        angular.forEach(response, function (image, key) {
            $scope.gallery.images[key] = {
              srcThumbNail: image.src.replace('.jpg', '_big.jpg'),
              src: image.src,
              w: image.width,
              h: image.height
            };
        })
      })

    $http.get(config.url() + '/api/books/banner_book?code=' + code)
      .success(function (response) {
        if (response.image === null) {
          $scope.bannerImage = '/img/pics/' + code + '_banner.jpg';
        }else{
          $scope.bannerImage = response.image;
        };
      })

    $http.get(config.url() + '/api/books/description?code=' + code)
      .success(function (response) {
        $scope.description = response.text.replace(/([^>])\n/g, '$1<br/>'); //nl2br
      })

    $scope.gallery.opts = {
      index: 0,
      history: false,
      bgOpacity: 0.5
    };

    $scope.showGallery = function (i) {
      $scope.gallery.opts.index = i;
      $scope.gallery.show = true;
    };

    $scope.closeGallery = function () {
      $scope.gallery.show = false;
    };

    $scope.$on('$viewContentLoaded', function (scope) {
      $http.get(config.url() + '/api/books/remains?code=' + code)
        .success(function (response) {
           $scope.remains = response;
        })
    })

    $scope.isEditor = function() {
      return authorization.isEditor();
    }

  });
