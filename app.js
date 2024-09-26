const myApp = angular.module("Medium", ["ui.router", "toaster"]);

myApp.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state("login", {
      url: "/login",
      templateUrl: "views/Login/index.html",
      controller: "LoginCtrl"
    })
    .state("home", {
      url: "/",
      templateUrl: "views/Home/index.html",
      controller: "HomeCtrl",
    })
    .state("create-post", {
      url: "/createPost",
      templateUrl: "views/Post/index.html",
      controller: "PostCtrl"
    })
    .state("post-detail", {
        url: "/post/:postId",
        templateUrl: "views/PostDetail/index.html",
        controller: "PostDetailCtrl"
    }); 
});

// ------------------------- Authenticate ---------------------------------------//

myApp.controller('LoginCtrl', function($scope, AuthService, $state, toaster) {
    $scope.loginData = {
        email: '',
        password: ''
    };

    $scope.login = function() {
        $scope.loading = true;

        AuthService.login($scope.loginData.email, $scope.loginData.password)
            .then(function(response) {
                if (response.data.success) {
                    const token = response.data.data.token;
                    localStorage.setItem('authToken', token);
                    console.log('token', token)

                    const userData = response.data.data;
                    localStorage.setItem('userId', userData.user.id);
                    console.log(userData.user.id)

                    toaster.pop('success', "Login realizado com sucesso");
                    $state.go('home');
                } else {
                    $scope.loading = false;
                    toaster.pop('error', "Erro", "Falha ao realizar login");
                }
            })
            .catch(function(error) {
                $scope.loading = false;
                console.error("Erro ao realizar login:", error);
                toaster.pop('error', "Erro", "Falha ao realizar login");
            });
    };
});

// ------------------------- PostList - Home ---------------------------------------//

myApp.controller("HomeCtrl", function($scope, $state, PostService) {
    $scope.posts = [];
    $scope.loading = true;
    $scope.searchTitle = '';

    $scope.isAuthenticated = function() {
        const token = localStorage.getItem('authToken');
        return token !== null;
    };

    function loadPostsWithUsers() {
        $scope.loading = true; 
    
        PostService.getPosts().then(function(response) {
            const posts = response.data;
    
            $scope.posts = posts.map(post => ({
                ...post,
                userName: post.user ? post.user.name : 'Usuário Desconhecido',
                liked: post.is_liked
            }));
    
            $scope.loading = false; 
        }).catch(function(error) {
            console.error("Erro ao buscar os posts:", error);
            $scope.loading = false; 
        });
    }    

    $scope.searchPosts = function() {
        if ($scope.searchTitle.trim()) {
            $scope.loading = true;
            PostService.filterPosts({ title: $scope.searchTitle }).then(function(response) {
                $scope.posts = response.data;
                $scope.loading = false;
                $scope.$apply();
            }).catch(function(error) {
                console.error("Erro ao buscar posts:", error);
                $scope.loading = false;
                $scope.$apply();
            });
        } else {
            loadPostsWithUsers();
        }
    };

    $scope.toggleLike = function(post) {
        if (!$scope.isAuthenticated()) {
            toaster.pop('error', "Erro", "Você precisa estar logado para curtir um post.");
            return;
        }
    
        PostService.toggleLikePost(post.id)
            .then(function(response) {
                post.total_likes = post.total_likes + (response.data.success ? 1 : -1);
                post.liked = response.data.success; 
                toaster.pop('success', "Sucesso", response.data.message);
            })
            .catch(function(error) {
                console.error("Erro ao curtir/descurtir o post:", error);
                toaster.pop('error', "Erro", "Ocorreu um erro ao processar sua solicitação.");
            });
    };
       
    
    $scope.goToCreatePost = function() {
        $state.go('create-post');
    };

    $scope.onCardClick = function(postId) {
        $state.go('post-detail', { postId: postId });
    };

    $scope.logout = function(){
        $scope.loading = true;
        localStorage.removeItem('userId');
        localStorage.removeItem('authToken');

        setTimeout(() => {
            $state.go('login');
        }, 2000);
    };

    loadPostsWithUsers();
});

// ------------------------- CreatePost - Post ---------------------------------------//

myApp.controller("PostCtrl", function($scope, $state, PostService, toaster) {
    $scope.newPost = {};
    $scope.loading = true;
    $scope.userName = '';

    $scope.getUserName = function(){
        return PostService.getUserNameById()
            .then(function(response){
                $scope.userName = response.data.name; //atualiza la no HTML A
            })
            .catch(function(error){
                console.error("Erro ao buscar o nome do usuário:", error);
            })
    }

    $scope.createPost = function() {
        $scope.loading = true;

        const token = localStorage.getItem('authToken');

        if (!token) {
            toaster.pop('error', "Erro", "Usuário não autenticado. Faça login para criar um post.");
            $scope.loading = false;
            return;
        }

        PostService.createPost($scope.newPost)
            .then(function(response) {
                $scope.loading = false;
                toaster.pop('success', "Post Criado", "O post foi criado com sucesso!");
                $scope.goToHome();
            })
            .catch(function(error) {
                $scope.loading = false;
                toaster.pop('error', "Erro", "Falha ao criar o post. Tente novamente.");
            });
    };

    $scope.getUserName().finally(function(){
        $scope.loading = false
    });

    $scope.goToHome = function() {
        $state.go('home');
    };
});

// ------------------------- PostDetail ---------------------------------------//

myApp.controller("PostDetailCtrl", function($scope, $stateParams, PostService, $state, toaster) {
    $scope.post = {};
    $scope.loading = true;
    $scope.userName = ''; 
    $scope.userId = localStorage.getItem('userId');

    $scope.isAuthenticated = function() {
        const token = localStorage.getItem('authToken');
        return token !== null;
    };

    $scope.checkIfOwner = function(post) {
        return $scope.userId === String(post.authorId);
    };

    $scope.getUserName = function() {
        return PostService.getUserNameById()
            .then(function(response) {
                $scope.userName = response.data.name;
            })
            .catch(function(error) {
                console.error("Erro ao buscar o nome do usuário:", error);
            });
    };

    function loadPostWithUser() {
        const postId = $stateParams.postId;

        return PostService.getPostById(postId).then(function(response) {
            const post = response.data;
            console.log("Post data received:", post); 

            $scope.post = {
                id: post.id,
                title: post.title,
                text: post.text,
                date: post.available_at,
                totalLikes: post.total_likes, 
                authorAvatar: 'https://via.placeholder.com/100',
                authorName: post.user ? post.user.name : 'Usuário Desconhecido',
                authorId: post.user_id
            };
        }).catch(function(error) {
            console.error("Erro ao carregar o post:", error);
        });
    }

    $scope.getUserName()
        .then(function() {
            return loadPostWithUser();
        })
        .then(function() {
            $scope.loading = false;
        })
        .catch(function(error) {
            console.error("Erro ao carregar dados:", error);
            $scope.loading = false;
        });

    $scope.delete = function() {
        $scope.loading = true;
        const postId = $stateParams.postId;
    
        PostService.deletePost(postId)
            .then(function(response) {
                console.log("Post deleted successfully:", response);
                $state.go('home');
                toaster.pop('success', "Sucesso", "Post deletado com sucesso!");
            })
            .catch(function(error) {
                console.error("Error deleting post:", error);
                toaster.pop('error', "Erro", "Falha ao deletar o post.");
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.goToHome = function() {
        $state.go('home');
    };

    $scope.goToCreatePost = function() {
        $state.go('create-post');
    };
});



