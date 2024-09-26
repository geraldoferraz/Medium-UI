myApp.service('PostService', function($http) {
    this.getPosts = function() {
        return $http.get('http://localhost:3333/posts');
    };

    this.getUserNameById = function(){
        const token = localStorage.getItem('authToken');
        
        return $http.get('http://localhost:3333/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    };

    this.getUserById = function() {
        const token = localStorage.getItem('authToken');
        
        return $http.get('http://localhost:3333/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    };

    this.getPostById = function(postId){
        return $http.get(`http://localhost:3333/post/${postId}`);
    };

    this.createPost = function(postData) {
        const token = localStorage.getItem('authToken');
        console.log('Token:', token); 
        
        return $http.post(`http://localhost:3333/post`, postData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    };

    this.toggleLikePost = function(postId) {
        const token = localStorage.getItem('authToken');
        
        return $http.post(`http://localhost:3333/posts/${postId}/like`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    };

    this.checkIfLiked = function(postId) {
        const userId = localStorage.getItem('userId');
        return $http.get(`http://localhost:3333/users/${userId}/posts/${postId}/liked`);
    };

    this.filterPosts = function(post) {
        return $http.post('http://localhost:3333/posts/filter', post);
    };

    this.deletePost = function(postId){
        return $http.delete(`http://localhost:3333/post/${postId}`)
    }
});
