/**
 * Created by raiym on 2/15/16.
 */
var application = angular.module('backup-it-for-me-instagram', ['ngRoute', 'ngNotify']);

application
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/check-account.view.html'
            })
            .when('/prepare-medias', {
                templateUrl: 'views/prepare-medias.view.html'
            })
            .when('/download-medias', {
                templateUrl: 'views/download-medias.view.html',
                controller: 'InstagramController'
            })
            .when('/check-username', {
                templateUrl: 'views/check-account.view.html',
                controller: 'InstagramController'
            })
            .otherwise({
                redirectTo: '/'
            });
    }]);


application
    .controller('InstagramController', function ($scope, $http, ngNotify, $window, userService) {
        $scope.username = '';
        $scope.isInputDisabled = false;
        $scope.currentInstagramAccount = userService.getCurrentInstagramAccount();
        $scope.zipUrl = '';
        $scope.isMediaPreparing = false;

        $scope.loadCurrentInstagramAccount = function () {
            $scope.currentInstagramAccount = userService.getCurrentInstagramAccount();
            if ($scope.currentInstagramAccount == 'undefined'
                || typeof $scope.currentInstagramAccount == 'undefined'
                || $scope.currentInstagramAccount == null) {
                $window.location.href = '#/check-username'
            }
        };

        $scope.checkUsername = function (username) {
            $scope.isInputDisabled = true;
            $http.post('api/checkUsername/' + username)
                .then(function (response) {
                    $scope.isInputDisabled = false;
                    console.log(response.data);
                    if (response.data.error !== 0) {
                        ngNotify.set(response.data.message, {
                            position: 'bottom',
                            type: 'warn'
                        });
                    } else {
                        ngNotify.set('Account is okay.', {
                            position: 'bottom',
                            type: 'info'
                        });
                        userService.saveInstagramAccount(response.data.data);
                        $window.location.href = '#/prepare-medias';
                    }
                }, function (response) {
                    $scope.isInputDisabled = false;
                    ngNotify.set('Something went wrong.', {
                        position: 'bottom',
                        type: 'info'
                    });

                });
        };

        $scope.prepareMedias = function () {
            $scope.isMediaPreparing = true;
            $http.post('api/prepareMedias/' + $scope.currentInstagramAccount.username)
                .then(function (resp) {
                    console.log(resp.data);
                    $scope.zipUrl = resp.data.data.zipUrl;
                    $scope.isMediaPreparing = false;
                }, function (resp) {
                    console.log(resp.data);
                    $scope.isMediaPreparing = false;
                    ngNotify.set('Connection timeout. =(', {
                        position: 'bottom',
                        type: 'error',
                        duration: 7000
                    });

                });
        }

    });

application
    .factory('userService', function () {
        var factory = {};
        var currentInstagramAccount;

        factory.saveInstagramAccount = function (account) {
            currentInstagramAccount = account;
        };

        factory.getCurrentInstagramAccount = function () {
            return currentInstagramAccount;
        };

        factory.isCurrentInstagramAccountSaved = function () {
            return !!currentInstagramAccount;
        };
        return factory;
    });

application.directive('autoFocus', function ($timeout) {
    return {
        restrict: 'AC',
        link: function (_scope, _element) {
            $timeout(function () {
                _element[0].focus();
            }, 0);
        }
    };
});