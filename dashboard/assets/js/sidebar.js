$(".hamburger").on("click", function() {
    console.log("click");
    $("#sidebarExtension").toggleClass("closed");

    $(".dashboardItem").toggleClass("navbarExtended");
});