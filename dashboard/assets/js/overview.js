function updateDayOfWeekMessageChart(data) {
    const width = 500;
    const height = 300;
    const margin = { top: 50, right: 50, bottom: 50, left: 100 };
    const color = "steelblue";

    for (weekdayID of [1, 2, 3, 4, 5, 6, 7]) {
        if (!data.some(day => day._id === weekdayID)) {
            const weekdayData = {
                _id: weekdayID,
                count: 0
            }
            data.push(weekdayData);
        }
    }

    // Sort Sunday-Saturday
    data.sort((a, b) => a._id - b._id);

    let messageTotal = 0;
    for (let day of data) {
        switch(day._id) {
            case 1: {
                day.dayLong = "Sunday";
                day.day = "Sun";
                break;
            } case 2: {
                day.dayLong = "Monday";
                day.day = "Mon";
                break;
            } case 3: {
                day.dayLong = "Tuesday";
                day.day = "Tues";
                break;
            } case 4: {
                day.dayLong = "Wednesday";
                day.day = "Wed";
                break;
            } case 5: {
                day.dayLong = "Thursday";
                day.day = "Thur";
                break;
            } case 6: {
                day.dayLong = "Friday";
                day.day = "Fri";
                break;
            } case 7: {
                day.dayLong = "Saturday";
                day.day = "Sat";
                break;
            } default: {
                break;
            }
        }
        messageTotal += day.count;
    }

    const svg = d3.select("#dayOfWeekMessageChart")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", "100%")
        .attr("height", `${height}px`)
        .attr("preserveAspectRatio", "none");

    function fixFontSize() {
        const width = 500;
        const newWidth = svg.node().getBoundingClientRect().width;
        const scale = width / newWidth;

        const text = svg.selectAll("text");

        // Increase text scale proportional to overall scale reduction
        // e.g. 3/4 of the original width -> scale text by 4/3
        text.attr("transform", `scale(${scale}, 1)`);
    }
    
    // Fix font size
    $(window).on("load", fixFontSize);
    $(window).on("resize", fixFontSize);
    new ResizeObserver(fixFontSize).observe($(".chart-container")[0]);

    x = d3.scaleBand()
        .domain(d3.range(data.length))
        .range([margin.left, width - margin.right])
        .padding(0.3);

    y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count / messageTotal)]).nice()
        .range([height - margin.bottom, margin.top])

    xAxis = g => g
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(i => data[i].day).tickSizeOuter(0))
        .style("font-size", "16px")
    
    yAxis = g => g
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y).ticks(null, "%"))
        .style("font-size", "16px")
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -75)
            .attr("y", 30)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Frequency"));
    
    svg.append("g")
        .call(xAxis);
    
    svg.append("g")
        .call(yAxis);

    // create a tooltip
    var tooltip = d3.select("#day-of-week-messages-chart")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("pointer-events", "none");


    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(event) {
        tooltip
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1)
    }
    var mousemove = function(event) {
        const width = 500;
        const newWidth = svg.node().getBoundingClientRect().width;
        const scale = width / newWidth;

        tooltip
            .html(`<strong>${this.__data__.dayLong}</strong><br>
                Frequency: ${(this.__data__.count / messageTotal * 100).toFixed(2)}%<br>
                Messages: ${this.__data__.count}`)
            .style("left", ((d3.pointer(event)[0] + 50) / scale) + "px")
            .style("top", (d3.pointer(event)[1]) + "px")
    }
    var mouseleave = function(event) {
        tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 1)
    }

    // Bars
    svg.append("g")
        .attr("fill", color)
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d, i) => x(i))
        .attr("y", d => y(d.count / messageTotal))
        .attr("height", d => y(0) - y(d.count / messageTotal))
        .attr("width", x.bandwidth())
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    
    svg.node();
    return;
}

function updateWeeklyMessageChart(data) {
    var parseDate = d3.utcParse("%Y-%m-%d %H");
    var dateToString = (dateObject) => {
        return `${dateObject.year}-${dateObject.month}-${dateObject.day} ${dateObject.hour}`;
    }

    var parsedData = data.map(hourMessages => {
        const dateString = dateToString(hourMessages._id);
        const date = parseDate(dateString);
        return {
            date: date,
            count: hourMessages.count
        }
    });

    var startDate = moment.utc(Date.now()).subtract(7, "days").startOf("hour");
    var endDate = moment.utc(Date.now()).startOf("hour");
    while (startDate <= endDate) {
        if (!parsedData.some(data => moment(data.date).isSame(startDate))) {
            parsedData.push({
                date: startDate.utc(false).toDate(),
                count: 0
            });
        }

        startDate.add(1, "hour");
    }

    parsedData.sort((a, b) => {
        if (a.date < b.date) return -1;
        else if (a.date > b.date) return 1;
        return 0;
    })
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60};
    var width = 1000 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#weekly-messages-chart")
        .append("svg")
            .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
            .attr("width", "100%")
            .attr("height", `${height + margin.top + margin.bottom}px`)
            .attr("preserveAspectRatio", "none")
    .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    function fixFontSize() {
        const width = 910;
        const newWidth = svg.node().getBoundingClientRect().width;
        const scale = width / newWidth;

        const text = svg.selectAll("text");

        // Increase text scale proportional to overall scale reduction
        // e.g. 3/4 of the original width -> scale text by 4/3
        text.attr("transform", `scale(${scale}, 1)`);
    }
    
    // Fix font size
    $(window).on("load", fixFontSize);
    $(window).on("resize", fixFontSize);
    new ResizeObserver(fixFontSize).observe($(".chart-container")[0]);

    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        .domain([moment.utc(Date.now()).subtract(7, "days").startOf("hour"), moment.utc(Date.now()).startOf("hour")])
        .range([ 0, width ]);

    var xAxis = g => g
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x)
            .ticks(d3.timeDay, 1)
            .tickFormat(d3.utcFormat("%_m/%e"))
            .tickSize(10))
        .style("font-size", "14px")

    var xMinorAxis = g => g
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x)
            .ticks(d3.timeHour.every(6))
            .tickFormat("")
            .tickSize(5))

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(parsedData, function(d) { return d.count })])
        .nice(4)
        .range([ height, 0 ]);
        
    var yAxis = g => g
        .call(d3.axisLeft(y)
            .ticks(4))

    var area = d3.area()
        .x(function(d) { return x(d.date); })
        .y0(height)
        .y1(function(d) { return y(d.count); });

    var line = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.count); });

    // Draw
    svg.append("g")
        .attr("class", "x-axis")
        .call(xAxis)

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .style("font-size", "14px");

    svg.append("g")
        .attr("class", "minor-x-axis")
        .call(xMinorAxis)

    // Lines
    svg.append("path")
        .datum(parsedData)
        .attr("class", "area")
        .attr("d", area);

    // Area under the curve
    svg.append("path")
        .datum(parsedData)
        .attr("class", "line")
        .attr("d", line);

    // This allows to find the closest X index of the mouse:
    var bisect = d3.bisector(function(d) { return d.date; }).left;

    // Create the circle that travels along the curve of chart
    var focus = svg
        .append('g')
        .append('circle')
            .style("fill", "none")
            .attr("stroke", "black")
            .attr('r', 5)
            .style("opacity", 0)

    // create a tooltip
    var tooltip = d3.select("#weekly-messages-chart")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("pointer-events", "none");

    // Create a rect on top of the svg area: this rectangle recovers mouse position
    svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);

    // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover(event) {
        focus.style("opacity", 1)
        tooltip.style("opacity",1)
    }

    function mousemove(event) {
        const width = 910;
        const newWidth = svg.node().getBoundingClientRect().width;
        const scale = width / newWidth;

        // recover coordinate we need
        var x0 = x.invert(d3.pointer(event)[0]);
        var i = bisect(parsedData, x0, 1, parsedData.length - 1);
        var leftDate = x0 - parsedData[i - 1].date;
        var rightDate = parsedData[i].date - x0;
        selectedData = x0 - parsedData[i - 1].date < parsedData[i].date - x0 ? parsedData[i - 1] : parsedData[i];
        focus
            .attr("cx", x(selectedData.date))
            .attr("cy", y(selectedData.count))
        const monthString = parseInt(selectedData.date.getMonth() + 1, 10);
        const dayString = selectedData.date.getDate();
        const yearString = String(selectedData.date.getFullYear()).slice(2);
        const hourString = selectedData.date.getHours();
        const minuteString = String(selectedData.date.getMinutes()).padStart(2, "0");

        const timeString = moment(selectedData.date).format("M/D/YY h:mm A");

        tooltip
            .html(`<strong>${timeString}</strong><br>
                Messages: ${selectedData.count}`)
            .style("left", `${(x(selectedData.date) + 40) / scale}px`)
            .style("top", `${y(selectedData.count)}px`)
        }
    function mouseout(event) {
        focus.style("opacity", 0)
        tooltip.style("opacity", 0)
    }
}

updateDayOfWeekMessageChart(messages);
updateWeeklyMessageChart(hourlyMessages);