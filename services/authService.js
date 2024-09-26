myApp.service('AuthService', function($http) {
    this.login = function(email, password) {
        return $http.post('http://localhost:3333/authenticate', { email: email, password: password });
    };
});
