$("#categories li")[0].classList.add("active");

$("#categories li").on("click", setCategory);

function setCategory() {
    $("#categories li").removeClass("active");

    const selected = $(this);
    selected.addClass("active");
    const categoryName = $(this).attr("id") // the id is the category name

    $("#commands li").hide();

    const categoryCommands = $(`#commands .${categoryName.toLowerCase()}`);

    categoryCommands.show();

    $("#commandError").text(categoryCommands.length <= 0
        ? "There is nothing to see here."
        : "");
}

setCategory.bind($("#categories li")[0])();

// Search button clicked
$("#search + button").on("click", function() {
    const query = $("#search input").val();
    if (!query.trim()) {
        blank();
        updateResultsText(commands);
        $("#commands li").show();
        return;
    }

    const results = new Fuse(commands, {
        keys: [
            { name: "name", weight: 1 },
            { name: "category", weight: 0.5 },
            { name: "description", weight: 0.1 }
        ],
        isCaseSensitive: false,
        threshold: 0.2
    })
    .search(query)
    .map(r => r.item);

    blank();

    for (const command of results) {
        $(`#${command.name}Command`).show();
    }

    updateResultsText(results);
})

function blank() {
    $("#categories li").removeClass("active");
    $("#commands li").hide();
}

function updateResultsText(arr) {
    // If no results
    $("#commandError").text(arr.length <= 0
        ? "There is nothing to see here."
        : "");
}