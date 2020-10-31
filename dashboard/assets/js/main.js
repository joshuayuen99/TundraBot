$(function () {
    $('[data-toggle="tooltip"]').tooltip({
        boundary: "window"
    });
});

// Delay transitions to fix Chrome bug
$(document).ready(function () {
    $(".css-transitions-only-after-page-load").each(function (index, element) {
        setTimeout(function () { $(element).removeClass("css-transitions-only-after-page-load") }, 10);
    });
});

// Toggle multiple choice
$("select[multiple] option").mousedown(function(){
    var $self = $(this);
 
    if ($self.prop("selected"))
           $self.prop("selected", false);
    else
        $self.prop("selected", true);
 
    return false;
 });