var auto_load_server_id = "";
var currentActiveServer = "dashboard";
var navBarOpen = false;
var valuesEdited = false;
var server_list = [];
var user_info;

const malRanks = {
  ANIME: 'Anime',
  MANGA: 'Manga',
  NOT_SET: 'Not Set'
}

var currentEditing;
const serverSettings = {
  NONE: null,
  PREFIX: 'prefix',
  ROLES: 'roles'
}

function checkIfSaved(){
  if(valuesEdited == false) return true;
  
  var continue_load = confirm("You have yet to save your settings, continue?");
  if(continue_load) {
    valuesEdited = false;
  }
  return continue_load;
}

window.onbeforeunload = function() {
  if(valuesEdited){
    return "You have yet to save your settings, continue?";
  }
  return;
};

if (window.location.pathname == "/dashboard" || window.location.pathname == "/dashboard/") {
  openDashboard();
} else if (window.location.pathname.includes("/dashboard/server/")) {
  var server_id = window.location.pathname.replace("/dashboard/server/", "");
  if (server_id == "") openDashboard();
  else {
    auto_load_server_id = server_id;
  }
} else {
  openDashboard();
}

$("#other-server-label").css("display", "none!important;");

var prefixButton = document.getElementById("prefix-edit-button");
prefixButton.addEventListener('click', () => {
  openNav(false, prefixButton, serverSettings.PREFIX);
});

var rolesButton = document.getElementById("roles-edit-button");
rolesButton.addEventListener('click', () => {
  openNav(false, rolesButton, serverSettings.ROLES);
});

var daysInput = document.getElementById("days-input");
daysInput.addEventListener("change", () => {
  updateRankDays(daysInput);
})

var prefixInput = document.getElementById("prefix-input");
prefixInput.addEventListener("change", () => {
  updatePrefix(prefixInput);
})

function openServer(server_id) {
  if(checkIfSaved() == false) return;
  if(currentActiveServer == server_id) return;
  closeNav();

  server = server_list.find(x => x.server_id == server_id);
  if(server == null){
    openDashboard();
    return;
  }

  console.log("Opening Server: " + server.name + " (" + server.server_id + ")");
  console.log(server);
  window.history.pushState("object or string", escape(server.name), "/dashboard/server/" + server.server_id.toString());

  if (currentActiveServer != "") {
    $("#" + currentActiveServer).removeClass("active");
  }
  currentActiveServer = server_id;
  $("#" + server_id).addClass("active");
  $(".dashboard").removeClass("active");
  $(".server-name").html(server.name);
  $("#prefix").html(server.prefix);
  $("#bot-info").css("display", "none");
  
  $(".serverinfo").removeClass("serverinfo-hidden");
  if(server.server_statistics){
    $("#commands").css("display", "initial");
    $("#commands").html(server.server_statistics.CommandsUsed);
  }else{
    $("#commands").css("display", "none");
  }

  var newAnimeHtml = "<thead>" +
      "<tr>" +
      "<th>Anime Roles</th>" +
      "<th>Anime Days</th>" +
      "</tr>"
    "</thead>";

    var newMangaHtml = "<thead>" +
      "<tr>" +
      "<th>Manga Roles</th>" +
      "<th>Manga Days</th>" +
      "</tr>"
    "</thead>";

  if(server.server_ranks){
    var animeRoles = server.server_ranks.AnimeRanks;
    var mangaRoles = server.server_ranks.MangaRanks;
    animeRoles.sort((a, b) => b.Days - a.Days);
    mangaRoles.sort((a, b) => b.Days - a.Days);

    if (animeRoles.length > 0) {
      for (var animeIndex = 0; animeIndex < animeRoles.length; animeIndex++) {
        var template = "<tbody>" +
          "<tr>" +
          "<td>" + animeRoles[animeIndex].Name + "</td>" +
          "<td>" + animeRoles[animeIndex].Days + " Days</td>" +
          "</tr>" +
          "</tbody>"
        newAnimeHtml += template;
      }
    }

    if (mangaRoles.length > 0) {
      for (var mangaIndex = 0; mangaIndex < mangaRoles.length; mangaIndex++) {
        var template = "<tbody>" +
          "<tr>" +
          "<td>" + mangaRoles[mangaIndex].Name + "</td>" +
          "<td>" + mangaRoles[mangaIndex].Days + " Days</td>" +
          "</tr>" +
          "</tbody>"
        newMangaHtml += template;
      }
    }
  }

  $(".anime-roles").html(newAnimeHtml);
  $(".manga-roles").html(newMangaHtml);
}

function openDashboard() {
  if(!checkIfSaved()) return;
  closeNav();

  auto_load_server_id = "";
  window.history.pushState("object or string", "Dashboard", "/dashboard");
  $(".server-name").html("Dashboard");

  if (currentActiveServer != "") {
    $("#" + currentActiveServer).removeClass("active");
  }
  $(".dashboard").addClass("active");
  $("#bot-info").css("display", "initial");
  $(".serverinfo").addClass("serverinfo-hidden");
  currentActiveServer = "dashboard";
}

function checkExists(imageUrl, callback) {
  var img = new Image();

  img.onerror = function () {
    callback(false);
  };

  img.onload = function () {
    callback(true);
  }; currentActiveServer
  img.src = imageUrl;
}

$(function () {
  'use strict'

  var myServers;
  $.ajax("/api/me/servers")
      .done(function (result) {

        server_list = JSON.parse(result);
        myServers = server_list;

        for (var serverIndex = 0; serverIndex < server_list.length; serverIndex++) {
          var server = server_list[serverIndex];
          addServer(server, "server-list");
        }
  }).then(() =>{
    $.ajax("/api/me/servers?all=1")
      .done(function (result) {

        server_list = JSON.parse(result);

        for (var serverIndex = 0; serverIndex < server_list.length; serverIndex++) {
          var server = server_list[serverIndex];
          if(myServers.find(x => x.server_id == server.server_id)) continue;

          $("#other-server-label").css("display", "initial");
          addServer(server, "other-server-list");
        }
      }).fail(function (xhr, status){
        console.log("OK!")
      })
  })

  $.ajax("/api/me")
    .done(function (result) {
      user_info = JSON.parse(result);
    })
}())

function addServer(server, list_id){
  var imageURL = "/static/images/default-server.png";
  if (server.icon) {
    imageURL = server.icon;
  }

  var template = "<li class=\"nav-item\">" +
    "<span class=\"nav-link server-names\" id=\"" + server.server_id.toString() + "\" onclick=\"openServer('" + server.server_id.toString() + "')\">" +
    "<img src=\"" + imageURL + "\" width=\"\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-file-text\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path><polyline points=\"14 2 14 8 20 8\"></polyline><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"></line><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"></line><polyline points=\"10 9 9 9 8 9\"></polyline></img>" +
    server.name + "</span></li><span class=\"sr-only\">(current)</span>";

  var htmlString = $("#" + list_id).html();
  htmlString += template;
  $("#" + list_id).html(htmlString);

  var element = document.getElementById(server.server_id.toString());
  element.style.cursor = "pointer";

  if (auto_load_server_id != "" && auto_load_server_id == server.server_id.toString()) {
    $("#" + auto_load_server_id).addClass("active");
    $(".dashboard").removeClass("active");
    openServer(server.server_id.toString());
  }
}

var transitioning;
var currentNavElement;
function openNav(override, element, action) {
  if(currentNavElement == element) return;
  if(!checkIfSaved()) return; 
  if(transitioning && override != true) return;

  if(navBarOpen){
    transitioning = true;
    closeNav();
    setTimeout(() => { openNav(true, element, action) }, 600);
    return;
  }
  
  $("#save-error").html("");
  
  $("#role-settings").css("display", "none");
  $("#prefix-settings").css("display", "none");

  switch(action){
    case serverSettings.ROLES:
      currentEditing = serverSettings.ROLES;
      editRoles();
      break;
    case serverSettings.PREFIX:
      currentEditing = serverSettings.PREFIX;
      editPrefix();
      break;
  }

  document.getElementById("save-button").disabled = !valuesEdited;
  document.getElementById("rightsidebar").style.width = "600px";
  navBarOpen = true;
  transitioning = true;
  currentNavElement = element;
  setTimeout(() => {transitioning = false}, 500);
}

var currentRole = null;
function editRoles(){
  server = server_list.find(x => x.server_id == currentActiveServer);

  var animeRanks = server.server_ranks.AnimeRanks;
  var mangaRanks = server.server_ranks.MangaRanks;
  var notsetRanks = server.server_ranks.NotSetRanks;
  
  animeRanks.sort((a, b) => b.Days - a.Days);
  mangaRanks.sort((a, b) => b.Days - a.Days);


  var animeHtmlString = "";
  if(animeRanks.length > 0){
    animeHtmlString = '<a class="dropdown-item disabled" href="#">' + malRanks.ANIME + '</a>';
    for(var animeRoleIndex = 0; animeRoleIndex < animeRanks.length; animeRoleIndex++){
      animeHtmlString += '<a class="dropdown-item" href="#" onclick="animeRole(\'' + animeRanks[animeRoleIndex].Id.toString() + '\')">' + animeRanks[animeRoleIndex].Name + '</a>';
    }
  }

  var mangaHtmlString = "";
  if(mangaRanks.length > 0){
    mangaHtmlString = '<a class="dropdown-item disabled" href="#">' + malRanks.MANGA + '</a>';
    for(var mangaRoleIndex = 0; mangaRoleIndex < mangaRanks.length; mangaRoleIndex++){
      mangaHtmlString += '<a class="dropdown-item" href="#" onclick="mangaRole(\'' + mangaRanks[mangaRoleIndex].Id.toString() + '\')">' + mangaRanks[mangaRoleIndex].Name + '</a>';
    }
  }

  var notsetHtmlString = "";
  if(notsetRanks.length > 0){
    notsetHtmlString = '<a class="dropdown-item disabled" href="#">' + malRanks.NOT_SET + '</a>';
    for(var notsetRoleIndex = 0; notsetRoleIndex < notsetRanks.length; notsetRoleIndex++){
      notsetHtmlString += '<a class="dropdown-item" href="#" onclick="notsetRole(\'' + notsetRanks[notsetRoleIndex].Id.toString() + '\')">' + notsetRanks[notsetRoleIndex].Name + '</a>';
    }
  }

  $("#role-dropdown-label").html("Select Role");
  $("#ranktype-dropdown-label").html(malRanks.NOT_SET);
  $("#role-settings").css("display", "initial");

  document.getElementById("ranktype-dropdown-label").disabled = true;
  document.getElementById("days-input").disabled = true;
  document.getElementById("days-input").value = null;
  $("#role-dropdown").html(animeHtmlString + mangaHtmlString + notsetHtmlString);
}

function animeRole(roleId){
  server = server_list.find(x => x.server_id == currentActiveServer);
  var role = server.server_ranks.AnimeRanks.find(x => x.Id == roleId);
  
  document.getElementById("role-dropdown-label").innerHTML = role.Name;
  document.getElementById("ranktype-dropdown-label").disabled = false;
  document.getElementById("ranktype-dropdown-label").innerHTML = malRanks.ANIME;
  document.getElementById("days-input").value = role.Days;
  document.getElementById("days-input").disabled = false;

  currentRole = role;
  currentRole.rankType = malRanks.ANIME;
}

function mangaRole(roleId){
  server = server_list.find(x => x.server_id == currentActiveServer);
  var role = server.server_ranks.MangaRanks.find(x => x.Id == roleId);
  
  document.getElementById("role-dropdown-label").innerHTML = role.Name;
  document.getElementById("ranktype-dropdown-label").disabled = false;
  document.getElementById("ranktype-dropdown-label").innerHTML = malRanks.MANGA;
  document.getElementById("days-input").value = role.Days;
  document.getElementById("days-input").disabled = false;

  currentRole = role;
  currentRole.rankType = malRanks.MANGA;
}

function notsetRole(roleId){
  server = server_list.find(x => x.server_id == currentActiveServer);
  var role = server.server_ranks.NotSetRanks.find(x => x.Id == roleId);

  document.getElementById("role-dropdown-label").innerHTML = role.Name;
  document.getElementById("ranktype-dropdown-label").disabled = false;
  document.getElementById("ranktype-dropdown-label").innerHTML = malRanks.NOT_SET;
  document.getElementById("days-input").value = null;
  currentRole = role;
  currentRole.rankType = malRanks.NOT_SET;
}

function updateRankType(rankType){
  document.getElementById("ranktype-dropdown-label").innerHTML = rankType;
  document.getElementById("days-input").disabled = rankType == malRanks.NOT_SET;
  currentRole.rankType = rankType;
  valuesEdited = true;
  document.getElementById("save-button").disabled = !valuesEdited;
}

function updateRankDays(element){
  currentRole.Days = element.value;
  valuesEdited = true;
  document.getElementById("save-button").disabled = !valuesEdited;
}

function saveRole(){
  if(currentRole.Days == "") currentRole.Days = 0;
  console.log("-- START DATA --");
  console.log(currentRole);
  console.log("-- END DATA --");

  $.post("/api/server/" + currentActiveServer + "/role", currentRole)
    .done((res) => {
      var newServer = JSON.parse(res);

      console.log("Data Sent! Response: ");
      console.log(newServer);

      var server_index = server_list.findIndex(x => x.server_id == newServer.server_id);
      if(server_index > -1){
        server_list[server_index] = newServer;
      }

      document.getElementById("rightsidebar").style.width = "0";
      setTimeout(() => {transitioning = false}, 500);
      navBarOpen = false;
      valuesEdited = false;
      currentNavElement = null;
      currentActiveServer = null;
      $("#save-error").html("");

      openServer(newServer.server_id);
      currentEditing = serverSettings.NONE;
    }).fail((xhr, status, err) => {
      console.log("Error Sending Data!");
      $("#save-error").html(xhr.responseText);
    });
}

var previousPrefix = "al!";
var newPrefix = "al!";
function editPrefix(){
  $("#prefix-settings").css("display", "initial");
  server = server_list.find(x => x.server_id == currentActiveServer);
  previousPrefix = server.prefix;
  newPrefix = server.prefix;

  if(newPrefix == "al!"){
    prefixInput.value = null;
  }else{
    prefixInput.value = newPrefix;
  }
}


function updatePrefix(element){
  valuesEdited = previousPrefix != element.value;
  newPrefix = element.value;
  document.getElementById("save-button").disabled = !valuesEdited;
}

function savePrefix(){
  if(newPrefix == "") newPrefix = "al!";
  $.post("/api/server/" + currentActiveServer + "/prefix", { newPrefix })
    .done((res) => {
      var newServer = JSON.parse(res);

      console.log("Data Sent! Response: ");
      console.log(newServer);

      var server_index = server_list.findIndex(x => x.server_id == newServer.server_id);
      if(server_index > -1){
        server_list[server_index] = newServer;
      }

      document.getElementById("rightsidebar").style.width = "0";
      setTimeout(() => {transitioning = false}, 500);
      navBarOpen = false;
      valuesEdited = false;
      currentNavElement = null;
      currentActiveServer = null;
      $("#save-error").html("");

      openServer(newServer.server_id);
      currentEditing = serverSettings.NONE;
    }).fail((xhr, status, err) => {
      console.log("Error Sending Data!");
      console.log(xhr);
      $("#save-error").html(xhr.responseText);
    });
}

function closeNav() {
  if(!navBarOpen) return true;
  if(!checkIfSaved()) return false; 

  document.getElementById("rightsidebar").style.width = "0";
  navBarOpen = false;
  currentNavElement = null;

  setTimeout(() =>{
    $("#role-settings").css("display", "none");
    $("#prefix-settings").css("display", "none");
  }, 500);

  $("#save-error").html("");
  currentRole = null;
  currentEditing = serverSettings.NONE;
  return true;
}

function saveCloseNav() {
  switch(currentEditing){
    case serverSettings.ROLES:
      saveRole();
      break;
    case serverSettings.PREFIX:
      savePrefix();
      break;
  }
}

var editables = document.getElementsByClassName("editable");
for(var i = 0; i < editables.length; i++){
  var editable_element = editables[i];
  editable_element.onmouseenter = enableEditIcon;
  editable_element.onmouseleave = disableEditIcon;
}

var newestElement;
function enableEditIcon(element){
  if(user_info == null) return;

  var guild_info = user_info.guilds.find(x => x.server_id == currentActiveServer);
  if(guild_info == null && user_info.bypass != true) return;

  if(user_info.bypass != true){
    if(element.target.classList.contains("editable-roles")){
      if(guild_info.mangaroles == false && guild_info.admin == false) return;
    }

    if(element.target.classList.contains("editable-prefix")){
      if(guild_info.admin == false) return;
    }
  }


  if(user_info.bypass != true){
    if(guild_info.manageroles == false){
      if(guild_info.admin == false) return;
    }
  }

  if(newestElement){
    newestElement.innerHTML = "";
  }

  newestElement = element.target.getElementsByTagName("a")[0];
  newestElement.innerHTML = '<i class="fas fa-pen-square fa-xs"></i>';
}

function disableEditIcon(element){
  var disableElement = element.target.getElementsByTagName("a")[0];
  disableElement.innerHTML = "";
}