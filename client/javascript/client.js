$(document).ready(function(){
    var clientSocket = io.connect('');

    // Insert a drink

    $('#createDrink').submit(function(event){
        event.preventDefault();
        var drinkName = ($(event.target).find('#drinkName').val());
        var drinkLiq = ($(event.target).find('#drinkLiq').val());
        var drinkIng = ($(event.target).find('#drinkIng').val());

        var drinkDoc = {
            name: drinkName,
            liquor: drinkLiq,
            ingredients: drinkIng
        };

        clientSocket.emit('insert_database', drinkDoc);
    });

    clientSocket.on('insert_succesful', function() {
        $('#databaseResults').children().fadeOut(200);
        clientSocket.emit('req_all_database');
    });

    
    // Create a user account 
    $('#createAccount').submit(function(event){
        event.preventDefault();
        console.log("HI, new user!")
        var userName = ($(event.target).find('#userid').val());
        var psw = ($(event.target).find('#pswrd').val());
        var emailAddress = ($(event.target).find('#email').val());
        
         accountData = { 'userName': userName, 'password': psw , 'email': emailAddress };
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "/createAccount",
            data: accountData,
            success: function(data, textStatus, jqXHR){
                if (typeof data.redirect == 'string'){
                  window.location.replace(window.location.protocol + "//" + window.location.host + data.redirect);
                }
            },
            error: console.log("error")
        });
        console.log(accountData);
    });

    // clientSocket.on('insert_user_succesful', function() {
    //     $('#databaseResults').children().fadeOut(200);
    //     window.open("/profile");
    //     clientSocket.emit('req_all_database');
    // });
    
    // login 
    // $('#login').submit(function(event){
    //     event.preventDefault();
    //     console.log("login!")
    //     var userName = ($(event.target).find('#userName').val());
    //     var psw = ($(event.target).find('#password').val());
        
    //     userData = { 'userName': userName, 'password': psw };
    //     $.ajax({
    //         type: "POST",
    //         dataType: "json",
    //         url: "/login",
    //         data: userData,
    //         success: function(){console.log("successfully logged in"); window.open('./index');}
    //     });
    //     console.log(userData);
    //     //clientSocket.emit('login', userDoc);
    // });

    clientSocket.on('login_successful', function() {
        $('#databaseResults').children().fadeOut(200);
        window.open('./index');
        clientSocket.emit('req_all_database');
    });

    clientSocket.on('login_failed', function() {
        $('#databaseResults').children().fadeOut(200);
        alert("Wrong Password or Username, Please try it again");
        window.open('./createAccount');
        clientSocket.emit('req_all_database');
    });
    
    // Get all the drinks at load

    clientSocket.emit('search_database', JSON.stringify([]));

    // Search a drink

    $('#searchDrink').submit(function(event) {
        $('.drinkContainer').children().fadeOut(200).fadeIn(200).remove();
        event.preventDefault();
        var optionArray = $(event.target).find("option[selected|='selected']");
        var searchArray = [];
        var tuple = [];
        for (var i = 0; i < optionArray.length; i++) {
            tuple = [$(optionArray[i]).data('drinkname'), optionArray[i].innerHTML];
            searchArray.push(tuple);
        }
        clientSocket.emit('search_database', JSON.stringify(searchArray));
    });

    // Search succesful

    clientSocket.on('search_succesful', function(dataIn){
        searchResults(dataIn);
    });

    
    // Get all the ingredients for the token-array

    clientSocket.emit('req_all_ingredients');
    var value = Number($('#tokenize').children().last().prop('value'));

    clientSocket.on('res_all_ingredients', function(data) {
        value++;
        var ingredientToken;
        data = JSON.parse(data);
        if (data.hasOwnProperty('ingredients')){
             ingredientToken = $('<option>', {
                value: value,
                html: data.name,
                "data-drinkname": true
            });
        } else {
            ingredientToken = $('<option>', {
                value: value,
                html: data.name
            });
        }
        $('#tokenize').append(ingredientToken);
    });


    // SearchResults function

    var searchResults = function(dataIn) {
        var data = JSON.parse(dataIn);
        var drawDrinkArray = [];
        for (var i = 0; i < data.ingredients.length; i++) {
            drawDrinkArray.push([data.ingredients[i].name, data.ingredients[i].size, data.ingredients[i].color]);
        }
        data.ingredients = drawDrinkArray;
        // Create canvas element
        var drinkItemDiv = $('<div>', {
            class: "drinkItem"
        });

        var canvasElement = $('<canvas>', {
            id: data._id,
            class: "drinkItem"
        });

        // CREATE ALL DIVS FOR COMMENT/INSTRUCTIONS FIELD

        var desc = "This is a perfect drink for a hot summer evening!";
        var descUserName = "John";

        var comment1 = {
            userId: 1,
            userName: "Kalle",
            comment: "Awesome! Cool drink."
        };
        var comment2 = {
            userId: 1,
            userName: "Therese",
            comment: "Horrible. Had it last night, so hungover..."
        };
        var comment3 = {
            userId: 1,
            userName: "Robert",
            comment: "Ill try this tonight."
        };
        var comments = [];
        comments.push(comment1);
        comments.push(comment2);
        comments.push(comment3);

        var drinkInfoWrapper = $('<div>', {
            class: "drinkInfoWrapper"
        });

        var optionDiv = $('<div>', {
            class: "optionDiv"
        });

        var likeButton = $('<a>', {
            class: "heartButton"
        }).on('click', function(e) {
            var drinkId = $(this).parents('.drinkItem').children().prop('id');
            clientSocket.emit('drink_like', drinkId);
        });


        var commentButton = $('<a>', {
            class: "commentButton"
        }).on('click', function(e) {
            var ulComment = $(e.target).parents('.drinkInfoWrapper').find('.commentUl');
            var createCommentDiv = $('<div>', {
                class: "createComDiv"
            });

            var commentForm = $('<form>', {
               class: 'commentForm',
            }).submit(function(e){
                e.preventDefault();
                var commentText = $(e.target).find( "input" ).val();
                var userName = "Donald";
                var drinkId = $(e.target).parents('.drinkItem').children().prop('id');
                var comment = {
                    userName: userName,
                    commentText: commentText
                }
                clientSocket.emit('drink_comment', JSON.stringify(comment), drinkId);
                $(e.target).remove();
            });


            var inputField = $('<input>', {
                type: 'text',
                class: 'commentInput',
                placeholder: "Add a comment ..."
            });

            var submitButton = $('<input>', {
                type: 'submit',
                class: 'submitButtonCom',
                placeholder: "Submit"
            })
            $(commentForm).append(inputField);
            $(commentForm).append(submitButton);
            $(createCommentDiv).append(commentForm);
            $(ulComment).append(createCommentDiv);


            var drinkId = $(this).parents('.drinkItem').children().prop('id');
        });

        var selectInst = $('<div>', {
            class: "selectIng",
            html: "Instructions"
        }).on('click', function(e) {
            $(e.target).parent().parent().find('.instDiv').addClass('active').siblings('.active').removeClass('active');
            $(e.target).addClass('selectDisp').siblings('.selectDisp').removeClass('selectDisp');
        });

        var selectComment = $('<div>', {
            class: "selectCom selectDisp",
            html: "Comments"
        }).on('click', function(e) {
            $(e.target).parent().parent().find('.commentDiv').addClass('active').siblings('.active').removeClass('active');
            $(e.target).addClass('selectDisp').siblings('.selectDisp').removeClass('selectDisp');
        });

// COMMENT DIV CREATION

        var commentDiv = $('<div>', {
            class: "commentDiv active"
        });

        var likeDiv = $('<div>', {

            class: "likeDiv"
        });

        var pLike = $('<p>', {
            html: " " + data.like + " likes",
            class: "pLike"
        });

        var blueHeart = $('<a>', {
            class: "blueHeart"
        });

        $(likeDiv).prepend(blueHeart);
        $(likeDiv).append(pLike);

        var descDiv = $('<div>', {
            html: " " + desc,
            class: "descDiv"
        });

        var userName = $('<a>', {
            html: descUserName,
            class: "userName"
        });

        $(descDiv).prepend(userName);

        var commentUl = $('<ul>', {
            class: "commentUl"
        });

        for(var i = 0; i < comments.length; i++) {
            var commentLi = $('<li>', {
                class: "commentLi",
                html: " " + comments[i].comment
            });

            var comUserName = $('<a>', {
                html: comments[i].userName,
                class: "userName"
            });

            $(commentLi).prepend(comUserName);
            $(commentUl).append(commentLi);
        }

// END COMMENT DIV

// INSTRUCTION DIV CREATION

        var instDiv = $('<div>', {
            class: "instDiv"
        });

        var ingrDiv = $('<div>', {
            class: "ingrDiv"
        });

        var ingrUl = $('<ul>', {
            class: "ingrUl"
        });

        for(var i = 0; i < data.ingredients.length; i++) {
            var ingrLi = $('<li>', {
                class: "ingrLi",
                html: data.ingredients[i][0] + " " + data.ingredients[i][1] + " cl"
            });

            $(ingrUl).append(ingrLi);
        }

        var instructions = "Shake all ingredients (except banana slice) with ice and strain into a chilled whiskey sour glass. Garnish with the banana slice and serve.";

        var instDescDiv = $('<div>', {
            html: instructions,
            class: "instDescDiv"
        });

        $(ingrDiv).append(ingrUl);

        $(instDiv).append(ingrDiv);
        $(instDiv).append(instDescDiv);


        $(optionDiv).append(likeButton);
        $(optionDiv).append(commentButton);
        $(optionDiv).append(selectComment);
        $(optionDiv).append(selectInst);

        $(commentDiv).append(likeDiv);
        $(commentDiv).append(descDiv);
        $(commentDiv).append(commentUl);

        $(drinkInfoWrapper).append(optionDiv);
        $(drinkInfoWrapper).append(commentDiv);
        $(drinkInfoWrapper).append(instDiv);

        $(drinkItemDiv).append(canvasElement);
        $(drinkItemDiv).append(drinkInfoWrapper);
        $('.drinkContainer').append(drinkItemDiv).hide().fadeIn(200);
        drawDrink(data, data._id);
    };

    // Like succeded

    clientSocket.on('like_succeded', function(drinkId){
        var pLikeElement = $('#' + drinkId).siblings().find('.pLike');
        $('#' + drinkId).siblings().find('.heartButton').removeClass('heartButton').addClass('clickedHeart');
        var currentLikes = parseInt(pLikeElement.html());
        $('#' + drinkId).siblings().find('.pLike').html(" " + (currentLikes + 1) + " likes");
    });

    // Comment succeded

    clientSocket.on('comment_succeded', function(comment, drinkId){
        var comment = JSON.parse(comment);
        var commentUl = $('#' + drinkId).siblings().find('.commentUl');
        var commentLi = $('<li>', {
            class: "commentLi",
            html: " " + comment.commentText
        });
        var comUserName = $('<a>', {
            html: comment.userName,
            class: "userName"
        });
        $(commentLi).prepend(comUserName);
        $(commentUl).append(commentLi).hide().fadeIn(900);
    });


});




