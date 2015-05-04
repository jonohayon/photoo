var app = angular.module("photoo", ["ui.router"]);
app.config(function ($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise("/");
	$stateProvider.state("main", {
		url : "/",
		templateUrl : "templates/main.html"
	});
});
app.controller("navCtrl", function ($scope) {
	$(".sidebar.left").sidebar();
	$scope.toggleSideNav = function () {
		$(".sidebar.left").trigger("sidebar:toggle");
	}
});
app.controller("mainCtrl", function ($http, $scope) {
	$http.get("http://192.168.1.15:8080/api/user/rezozo/feed").success(function (data, status, headers, config) {
		$scope.images = data;
	});
	$scope.getComments = function () {
		$http.get("http://192.168.1.15:8080/api/user/rezozo/feed").success(function (data, status, headers, config) {
			$scope.images = data;
		});
	}
	$(".btn-add-floating").data("rotated", "false");
	$(".btn-add-floating").click(function () {
		var rotated = $(".btn-add-floating").data("rotated");
		if (rotated == "true") {
			$(".btn-add-floating").data("rotated", "false");
			$(".overlay").css("display", "none");
			$(".btn-add-floating").css("transform", "rotate(0deg)");
			$(".actions").fadeOut();
		} else {
			$(".btn-add-floating").data("rotated", "true");
			$(".overlay").css("display", "block");
			$(".btn-add-floating").css("transform", "rotate(45deg)");
			$(".actions").fadeIn();
		}
	});
});