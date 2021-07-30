// rule name
$("input#newRulesetName").on("input", function() {
    if ($(this)[0].checkValidity()) {
        $(this).removeClass("is-invalid");
        $(this).addClass("is-valid");
    } else {
        $(this).removeClass("is-valid");
        $(this).addClass("is-invalid");
    }

    // check if submit button should be clickable
    $("button#createNewRuleset").attr("disabled", !$("form#createRulesetForm")[0].checkValidity());
});

// kind = trigger, condition, effect
function addRulePartRow(kind) {
    const triggerSection = $("#autoModTriggerSection");

    const row = $(`<div class='row autoMod${kind}Row'></div>`);

    const typeCol = $("<div class='col-5'><p>Type</p></div>");

    typeCol.append($(`<div class='autoMod${kind}TypeDiv'></div>`));

    const optionCol = $("<div class='col-5'><p>Options</p></div>");

    row.append($("<div></div>"))
}

// change trigger type
$("select.autoModTriggerType").on("change", function() {
    const triggerType = $(this).attr("value");

    const triggerRow = $(this).parent().parent();
    const triggerTypeDiv = triggerRow.find(".autoModTriggerTypeDiv");
    const optionsDiv = triggerRow.find(".autoModTriggerOptionsDiv");

    
});

$(document).ready(function() {
    // check if submit button should be clickable
    $("button#createNewRuleset").attr("disabled", !$("form#createRulesetForm")[0].checkValidity());
});





function namePrefixFromKind(kind){
    namePrefix = "Triggers."
    if(kind == 1){
        namePrefix = "Conditions."
    }else if(kind == 2){
        namePrefix = "Effects."
    }

    return namePrefix
}

$(document).off('click', '.automod-add-rule-part')
$(document).on('click', '.automod-add-rule-part', function(evt){
    var kind = $(evt.target).closest("[data-automod-part-type]").attr("data-automod-part-type")

    var tbody = $(evt.target).parent().find("tbody");
    var rowIndex = tbody.children().length;
    var row = createPartRow(kind, rowIndex)

    console.log("Creating new: ", kind, rowIndex)
    tbody.append(row);
})

function createPartRow(kind, rowIndex){
    namePrefix = namePrefixFromKind(kind)

    var row = $("<tr class='automod-rule-row' data-automod-row-index='"+rowIndex+"'></tr>")

    var selectName = namePrefix+rowIndex+".Type"
    var typeSelect = $("<select class='form-control automod-type-dropdown' name='"+selectName+"'><option value='0' selected>None</option></select>")
    for (var i = 0; i < partMap.length; i++) {
        var partType = partMap[i]
        if(!partType || partType.kind != kind) continue;

        typeSelect.append("<option value='"+i+"'> "+partType.name+"</option>");
    }

    row.append($("<td class='d-flex'>").append(typeSelect))
    row.append("<td class='automod-options-column'></td>")

    row.append("<td><button type='button' class='btn btn-danger automod-delete-rule-part btn-sm' noconfirm>-</button></td>")

    return row
}

$(document).off('change', '.automod-type-dropdown')
$(document).on("change", ".automod-type-dropdown", function(evt){
    partTypeChanged($(evt.target));
})

function partTypeChanged(target){
    var rowElem = target.closest(".automod-rule-row")
    var kind = target.closest("[data-automod-part-type]").attr("data-automod-part-type")

    var optionsColumn = rowElem.find(".automod-options-column")
    var typSelectVal = target.val();

    var opts = []
    if (partMap[typSelectVal]){
        opts = partMap[typSelectVal].options;
    }

    var namePrefix = namePrefixFromKind(kind);

    var col = createOptionsColumn(opts, namePrefix+rowElem.attr("data-automod-row-index")+".Data.")
    optionsColumn.replaceWith(col)

    col.find("[data-plugin-multiselect]").each(function(i, v){
        $(v).themePluginMultiSelect({});
    })

    var typeDropdownCell = rowElem.find(".automod-type-dropdown").parent();
    typeDropdownCell.find("[data-toggle='tooltip']").detach()

    if(partMap[typSelectVal] && partMap[typSelectVal].description){
        var span = $('<span data-toggle="tooltip" data-placement="bottom"><i class="fas fa-question"></i></span>')
        span.attr("title", partMap[typSelectVal].description)
        span.tooltip();

        typeDropdownCell.append(span)
    }
}

$(document).off('click', '.automod-delete-rule-part')
$(document).on('click', '.automod-delete-rule-part', function(evt){
    var rowElem = $(evt.target).closest(".automod-rule-row")

    tbody = rowElem.parent();

    rowElem.detach();

    
    updateRowIndexes(tbody);
})

function updateRowIndexes(tbody){
    tbody.children("tr").each(function(i, v) {
        var row = $(v)
        row.attr("data-automod-row-index", i)

        var typeDropdown = row.find(".automod-type-dropdown")
        var name = typeDropdown.attr("name")
        name = name.replace(/\d+/g, i)
        typeDropdown.attr("name", name);

        var inputs = row.find('[name*=".Data."]')
        inputs.each(function(j, htmlInput){
            var name = $(htmlInput).attr("name")
            name = name.replace(/\d+/g, i)
            $(htmlInput).attr("name", name)
        })
    });
}

function createOptionsColumn(opts, namePrefix){
    var elem = $("<td class='automod-options-column'>")
    for (var i = 0; i < opts.length; i++) {
        var opt = opts[i];
        createOpt(elem, namePrefix+opt.Key, opt);
    }

    return elem;
}

function createOpt(cell, key, opt, namePrefix){
    var wrapper = $("<div class='col-md'><div class='form-group row'><label class='col-lg-2'>"+opt.Name+":</label><div class='col-lg-10 automod-part-setting'></div></div>")
    var column = wrapper.find(".automod-part-setting")

    switch(opt.Kind){
    case "int":
        var input = $("<input type='number' class='form-control' name='"+key+"'></input>");
        if(opt.Min !== 0 || opt.Max !== 0){
            input.attr("min", opt.Min)
            input.attr("max", opt.Max)
            input.attr("required", true)
        }

        if(opt.Default){
            input.attr("value", opt.Default)
        }

        column.append(input)
        break;
    case "string":
        var input = $("<input type='text' class='form-control' name='"+key+"'></input>");
        if(opt.Min !== 0 || opt.Max !== 0){
            input.attr("minlength", opt.Min)
            input.attr("maxlength", opt.Max)
            if(opt.Min !== 0){
                input.attr("required", true)
            }
        }

        if(opt.Default){
            input.attr("value", opt.Default)
        }

        column.append(input)
        break;
    case "bool":
        var input = $("<input type='checkbox' class='form-check-input' name='"+key+"'>")
        if(opt.Default){
            input.attr("checked", true)
        }

        var container = $("<div class='form-check'>")
        container.append(input)
        column.append(container)
        break;
    case "multi_role":
        cloneDropdown(column, "#automod-roledropdown-multi-template", key, true);
        break;
    case "role":
        cloneDropdown(column, "#automod-roledropdown-single-template", key, true);
        break;
    case "multi_channel":
        cloneDropdown(column, "#automod-channel-multi-template", key, true);
        break;
    case "multi_channel_cat":
        cloneDropdown(column, "#automod-channel-cat-multi-template", key, true);
        break;
    case "list":
        cloneDropdown(column, "#automod-list-selection-template", key, true);
        break;
    }

    cell.append(wrapper);
}

function cloneDropdown(column, id, name){
    var input = $(id).clone()
    input.attr("id", "")
    input.attr("name", name)
    input.removeClass("hidden")
    column.append(input)

    return input
}

$(".automod-rule-part-table tbody").each(function(i, v){
    updateRowIndexes($(v))
})