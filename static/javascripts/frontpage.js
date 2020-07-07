$(function() {
    if(document.cookie && document.cookie != ""){
        try{
            jsonCookie = JSON.parse(document.cookie);
            if(jsonCookie.username){
                $("#username").html(jsonCookie.username);
                $("#login").html("Logout");
                $("#login").attr("href", "/logout");
                $("#dashboard").css("visibility", "visible");
            }
        }catch(e){
            console.log(e);
        }
    }

    $.ajax("/api/discord/users/@me")
        .done(function(result){
            data = JSON.parse(result);
            console.log(data);
            $("#username").html(data.username);
            $("#login").html("Logout");
            $("#login").attr("href", "/logout");
            $("#dashboard").css("visibility", "visible");

            document.cookie = JSON.stringify({ username: data.username });
        })
        .fail(function(xhr, status, error){
            $("#username").html("");
            $("#login").html("Login");
            $("#login").attr("href", "/login");
            $("#dashboard").css("visibility", "hidden");

            document.cookie = JSON.stringify({ username: "" });
            
            if(xhr.status == 401){
                console.log(xhr.responseText);
                return;
            }
            console.error(xhr.status + " | " + xhr.responseText);
        })
});