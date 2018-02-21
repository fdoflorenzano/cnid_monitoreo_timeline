const vis = new Vue({
  el: "#vis_timeline",
  data: function () {
    return {
      MARGIN: {
        TOP: 0,
        BOTTOM: 0,
        LEFT: 0,
        RIGHT: 0
      },
      FILEPATH: 'data/output/data.json',

      windowWidth: 0,
      windowHeight: 0,

      organisms: {},
      fase: {},
      matters: {},
      type: {},
      superior_norms: {},

      data: [],

      svg: null,
      fisheye: d3.fisheye().power(4).radius(2000),
      scale: d3.scaleTime(),
      date: {
        parse: d3.timeParse('%d/%m/%Y'),
        format: d3.timeFormat("%B %d, %Y")
      },

      lines: null,

      tooltip: null,
      tooltipelement: null,
      tooltipped: false,
      selected: null,
      selectedInstitution: null,
      selectedMatters: [],

    }
  },
  computed: {
    height() {
      return 400;
    },
    width() {
      return this.windowWidth * 0.9;
    },
  },
  mounted() {
    this.$nextTick(function () {
      window.addEventListener('resize', this.getWindowWidth);
      window.addEventListener('resize', this.getWindowHeight);
      this.getWindowWidth();
      this.getWindowHeight();
      this.initialize();
      this.getData();
    })

  },
  methods: {
    initialize() {
      this.svg = d3.select("#container");
      this.tooltip = d3.select(".tooltip");
    },
    getWindowWidth(event) {
      this.windowWidth = document.documentElement.clientWidth;
    },
    getWindowHeight(event) {
      this.windowHeight = document.documentElement.clientHeight;
    },
    getData() {
      d3.json(this.FILEPATH,
        (error, json) => {
          this.organisms = json.dicts.organismo;
          this.fase = json.dicts.fase;
          this.matters = json.dicts.materia;
          this.type = json.dicts.tipo_norma;
          this.superior_norms = json.dicts.norma_superior;

          this.data = json.data;

          const sorted = this.data.sort((a, b) => this.date.parse(a.start_date) - this.date.parse(b.start_date));
          let i = 0;
          let j;
          const threshold = 20000000000;
          while (i < sorted.length) {
            if (i < sorted.length - 1 && this.date.parse(sorted[i + 1].start_date) - this.date.parse(sorted[i].start_date) < threshold) {
              j = i;
              while (j < sorted.length - 1 && this.date.parse(sorted[j + 1].start_date) - this.date.parse(sorted[i].start_date) < threshold) {
                j++;
              }
              for (let k = i; k <= j; k++) {
                sorted[k].size_group = (j - i) + 1;
                sorted[k].i = k - i;
              }
              i = j + 1;
            } else {
              sorted[i].size_group = 1;
              sorted[i].i = 0;
              i++;
            }
          }
          this.data = sorted;
          const margin = 50;

          this.scale
            .domain(d3.extent(this.data, d => this.date.parse(d.start_date)))
            .range([margin, this.width - margin]);

          const EXTENT = d3.extent(this.data, d => this.date.parse(d.start_date)).map(d => d.getFullYear());
          const years = d3.range(...EXTENT.map(n => Math.ceil(n / 10) * 10), 10).concat(EXTENT);


          this.svg
            .append('g')
            .attr('class', 'timeline')
            .append('line')
            .attr('stroke', 'black')
            .attr('opacity', 0.2)
            .attr('stroke-width', 2)
            .attr('x1', this.scale.range()[0] - margin)
            .attr('x2', this.scale.range()[1] + margin)
            .attr('y1', this.height / 2)
            .attr('y2', this.height / 2);

          const line_total_length = 300;
          const gap_size = 10;
          const max_group_size = d3.max(this.data, d => d.size_group);

          const base_height = (this.height - line_total_length) / 2;
          const max_height = base_height + line_total_length;

          const line_length = (line_total_length - (max_group_size - 1) * gap_size) / max_group_size;

          const y_height = d => (this.height - line_length * d.size_group - gap_size * (d.size_group - 1)) / 2;
          const y1 = d => y_height(d) + (line_length + gap_size) * d.i;
          const y2 = d => y1(d) + line_length;

          // const y1 = d => base_height + ((line_total_length - (d.size_group - 1) * gap_size) / d.size_group + gap_size) * d.i;
          // const y2 = d => base_height + ((line_total_length - (d.size_group - 1) * gap_size) / d.size_group + gap_size) * d.i + (line_total_length - (d.size_group - 1) * gap_size) / d.size_group;

          this.lines = this.svg
            .append('g')
            .attr('class', 'time_points')
            .selectAll('line')
            .data(this.data)
            .enter()
            .append('line')
            .attr('stroke', 'black')
            .attr('stroke-width', 6)
            .attr('x1', d => this.scale(this.date.parse(d.start_date)))
            .attr('x2', d => this.scale(this.date.parse(d.start_date)))
            .attr('y1', y1)
            .attr('y2', y2)
            .on('mouseover', (d, i, ele) => {
              this.tooltipelement = d;
              this.tooltipped = true;
              this.tooltip
                .style("left", (d3.event.clientX - 20) + "px")
                .style("top", (d3.event.clientY + 30) + "px");
              d3.select(ele[i])
                .attr('stroke-width', 7)
                .attr('stroke', 'red');
            })
            .on('mouseleave', (d, i, ele) => {
              this.tooltipelement = null;
              this.tooltipped = false;
              if (!this.selected || this.selected.id != d.id) {
                d3.select(ele[i])
                  .attr('stroke-width', 6)
                  .attr('stroke', 'black');
              }
            })
            .on('click', (d, i, ele) => {
              this.selectedInstitution = null;
              this.selectedMatters = [];
              this.applySelection();
              this.selected = this.selected == null ? d :
                this.selected.id == d.id ? null : d;
              d3.selectAll(ele)
                .attr('stroke-width', (_, j) => i == j ? 7 : 6)
                .attr('stroke', (_, j) => i == j ? 'red' : 'black');
            });

          const yearsG = this.svg
            .append('g')
            .attr('class', 'labels')
            .selectAll('g')
            .data(years)
            .enter()
            .append('g')
            .attr('class', 'label');

          const yearL = yearsG
            .append('line')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('x1', d => this.scale(new Date(d, 1, 1)))
            .attr('x2', d => this.scale(new Date(d, 1, 1)))
            .attr('y1', max_height + 20)
            .attr('y2', max_height + 10);

          const yearT = yearsG
            .append('text')
            .attr('x', d => this.scale(new Date(d, 1, 1)))
            .attr('y', max_height + 20)
            .attr('dy', 25)
            .attr('dx', -20)
            .text(d => d);

          let that = this;
          this.svg
            .on("mousemove", function () {
              that.fisheye.center(d3.mouse(this));
              that.lines
                .transition()
                .duration(75)
                .attr("x1", d => that.fisheye([that.scale(that.date.parse(d.start_date)), 100])[0])
                .attr("x2", d => that.fisheye([that.scale(that.date.parse(d.start_date)), 100])[0]);

              yearL
                .transition()
                .duration(75)
                .attr('x1', d => that.fisheye([that.scale(new Date(d, 1, 1)), 100])[0])
                .attr('x2', d => that.fisheye([that.scale(new Date(d, 1, 1)), 100])[0]);

              yearT
                .transition()
                .duration(75)
                .attr('x', d => that.fisheye([that.scale(new Date(d, 1, 1)), 100])[0]);
            })
            .on("mouseleave", function () {
              that.lines
                .transition()
                .duration(1000)
                .attr('x1', d => that.scale(that.date.parse(d.start_date)))
                .attr('x2', d => that.scale(that.date.parse(d.start_date)));

              yearL
                .transition()
                .duration(1000)
                .attr('x1', d => that.scale(new Date(d, 1, 1)))
                .attr('x2', d => that.scale(new Date(d, 1, 1)));

              yearT
                .transition()
                .duration(1000)
                .attr('x', d => that.scale(new Date(d, 1, 1)));
            });


        });
    },
    resize() {},
    applySelection() {

      const institutionCondition = d => !this.selectedInstitution || d.ministry == this.selectedInstitution;
      const matterCondition = d => arrayContainsArray(d.matter, this.selectedMatters);
      this.lines
        .attr('stroke', 'black')
        .attr('opacity', d => (matterCondition(d) && institutionCondition(d)) ? 1 : 0.2)

    },
    toggleInstitution(id) {
      if (this.selected) this.selected = null;
      this.selectedInstitution = this.selectedInstitution != id ? id : null;
      this.applySelection();
    },
    toggleMatter(id) {
      if (this.selected) this.selected = null;
      const i = this.selectedMatters.indexOf(id);
      if (i < 0) {
        this.selectedMatters = [...this.selectedMatters, id];
      } else {
        this.selectedMatters.splice(i, 1);
      }
      console.log(this.selectedMatters);
      this.applySelection()
    },
  },
  watch: {
    windowWidth: function (val) {
      this.resize();
    },
    windowHeight: function (val) {
      this.resize();
    },
  }
});