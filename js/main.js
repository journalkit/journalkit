// Preloader

window.onload = function() {
  $('.load').addClass('ed');
  $('#loader').hide();
};

// Functions

function getUserToken() {
  var token = localStorage.getItem("token");
  if (!token && window.location.pathname != '/login.html') {
    window.location = "/login.html";
  } 

  if (token && window.location.pathname == '/login.html') {
    window.location = "/index.html";
  }
  return token;
}

function a(url, method = 'get', data = {}) {
  try {
    data.secure = token;
    return $.parseJSON(
      $.ajax({
        url: 'http://almor.pythonanywhere.com/'+url + ((url.slice(-1) != '/')?'/':''),
        method: method,
        data: data,
        dataType: "json",
        async: false,
      }).responseText
    );
  } catch (err) {
    return false;
  }
}

function arrayIndex(array) {
  var resArr = [];
  for (var i = 0; i < array.length; i++) {
    resArr[array[i].id] = array[i];
  }
  return resArr;
}

function formatLog(res) {
  var log = '';
  for (var key in res) {
    log +=  '\n' + key + ': ' + res[key];
  }
  return log;
}

function month(num) {
  var arr = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  if (arr[num]) {
    return arr[num];
  }
  return arr;
}

function getIndices(array) {
  var resArr = [];
  for (var i = 0; i < array.length; i++) {
    resArr.push(array[i].id);
  }
  return resArr;
}

function plural(n,f){n%=100;if(n>10&&n<20)return f[2];n%=10;return f[n>1&&n<5?1:n==1?0:2]}

// Functions end

// Variables

var token = getUserToken();

// Variables end

// Handlers

$(document).on('submit', '.formLogin', function(e){
  e.preventDefault();
  var result = a('api/login/', 'post', $(this).serialize());
  if (result) {
    localStorage.setItem('token', result);
    window.location = "/index.html";
  } else {
    $(this).find('.form__message').text('Неверный логин или пароль');
  }
});

$(document).on('click', '#logout', function(e){
  localStorage.removeItem('token');
  window.location = "/login.html";
});

// Handlers end

// Components

if ($('#menu').length) {
  var menuApp = new Vue({
    el: '#menu',
    data: {
      role: a('roles')[0]
    },
  })
}

if ($('#index').length) {
  var user = a('users')[0];
  if (user.role == 2) {
    var statements = a('statements', 'get', {notClosed: 1});
    var exams = a('exams', 'get', {notClosed: 1});
    var disciplinesSource = a('disciplines');
    var disciplines = arrayIndex(disciplinesSource);
    var groupsSource = a('groups');
    var groups = arrayIndex(groupsSource);

    statements.forEach(function (item) {
      var date = new Date(Date.parse(item.date_open));
      item.name = disciplines[item.discipline].name + ' - ' + groups[item.group].name + ' за ' + month(date.getMonth()) + ' ' + date.getFullYear();
    })
    exams.forEach(function (item) {
      item.name = disciplines[item.discipline].name + ' - ' + groups[item.group].name + ' за ' + item.date;
    })
  }
  var indexApp = new Vue({
    el: '#index',
    data: {
      user: user,
      disciplines: disciplinesSource,
      statements: statements,
      exams: exams,
    },
  })
}

if ($('#users').length) {
  var usersApp = new Vue({
    el: '#users',
    data: {
      list: a('users/')
    },
    methods: {
      deleteItem: function (id, index) {
        if (confirm('Вы точно хотите удалить этого преподавателя?')) {
          a('users/' + id, 'delete');
          this.list.splice(index, 1);
        }
      },
      saveItem: function (id, index) {
        var item = this.list[index];
        var data = {
          name: item.name,
          surname: item.surname,
          patronymic: item.patronymic,
          login: item.login,
          password: (item.newPassword && item.newPassword != item.password)?item.newPassword:undefined,
          role: item.new?2:undefined
        };

        var res = item.new? a('users', 'post', data): a('users/' + id, 'patch', data);
        if (res.id) {
          if (item.new) {
            item.id = res.id;
            item.new = false;
          }
          alert('Данные сохранены');
        } else {
          alert('При сохранении произошла ошибка.\n' + formatLog(res));
        }
      },
      newItem: function () {
        this.list.unshift({new: true});
      },
      removeItem: function (index) {
        this.list.splice(index, 1);
      }
    }
  })
}

if ($('#exams').length) {
  var exams = a('exams/');
  var disciplines = arrayIndex(a('disciplines'));
  var users = arrayIndex(a('users'));
  var groups = arrayIndex(a('groups'));
  exams.forEach(function (item) {
    var user = users[disciplines[item.discipline].teacher];
    if (user) {
      item.teacher = user.surname + ' ' + user.name + ' ' + user.patronymic;
    } else {
      item.teacher = 'Не указан'
    }
    item.discipline = disciplines[item.discipline].name;
    item.group = groups[item.group].name;
  })
  var examsApp = new Vue({
    el: '#exams',
    data: {
      list: exams
    },
    methods: {
      deleteItem: function (id, index) {
        if (confirm('Вы точно хотите удалить этот экзамен?')) {
          a('exams/' + id, 'delete');
          this.list.splice(index, 1);
        }
      }
    }
  })
}

if ($('#tab').length) {
  var tabs = a('statements');
  var year = (new Date()).getFullYear();
  var disciplinesSource = a('disciplines');
  var disciplines = arrayIndex(disciplinesSource);
  var groupsSource = a('groups');
  var groups = arrayIndex(groupsSource);
  tabs.forEach(function (item) {
    item.disciplineName = disciplines[item.discipline].name;
    item.groupName = groups[item.group].name;
    var date = new Date(Date.parse(item.date_open));
    item.month = month(date.getMonth());
    item.year = date.getFullYear();
  })

  Vue.component('v-select', VueSelect.VueSelect);
  var tabApp = new Vue({
    el: '#tab',
    data: {
      list: tabs,
      filter: {
        discipline: "ns",
        group: "ns",
        month: "ns",
        year: "ns",
        status: "ns",
      },
      disciplines: disciplinesSource,
      groups: groupsSource,
      month: month(),
      year: [year-1, year, year+1],

      curItem: false,
      lessons: [],
      students: [],
      records: [],
      themes: [],
      themesIndexed: [],
      themesSelect: [],
      curLesson: false,
      newTab: false,

    },
    computed: {
      filterList: function () {
        return this.list.filter(function (item) {
          filter = this;
          if (filter.discipline != "ns" && item.discipline != filter.discipline) {
            return false;
          }
          if (filter.group != "ns" && item.group != filter.group) {
            return false;
          }
          if (filter.month != "ns" && item.month != filter.month) {
            return false;
          }
          if (filter.year != "ns" && item.year != filter.year) {
            return false;
          }
          if (filter.status != "ns" && ((item.date_close && filter.status == 1) || (!item.date_close && filter.status == 2))) {
            return false;
          }
          return true;
        }, this.filter)
      },
    },
    methods: {
      closeTab: function (id, index) {
        if (confirm('Вы точно хотите закрыть табель?')) {
          var date = (new Date()).toISOString().substr(0,10);
          this.list[index].date_close = date;
          a('statements/' + id, 'patch', {date_close: date});
        }
      },
      createTab: function () {
        var date = new Date();
        this.newTab = {
          // date_open: date.toISOString().substr(0,10),
          month: date.getMonth(),
          year: date.getFullYear(),
        };
      },
      saveNewTab: function () {
        for (var i = 0; i < this.list.length; i++) {
          if (this.list[i].discipline == this.newTab.discipline && this.list[i].group == this.newTab.group && this.list[i].month == month(this.newTab.month) && this.list[i].year == this.newTab.year) {
            alert('Такой табель уже существует!');
            return false;
          }
        }

        this.newTab.date_open = (new Date(this.newTab.year,this.newTab.month,2)).toISOString().substr(0,10);
        var res = a('statements', 'post', this.newTab);
        if (res.id) {
          this.list.unshift({
            id: res.id,
            date_open: this.newTab.date_open,
            discipline: res.discipline,
            group: res.group,
            disciplineName: disciplines[res.discipline].name,
            groupName: groups[res.group].name,
            month: month(this.newTab.month),
            year: this.newTab.year,
          });
          this.newTab = false;
        } else {
          alert('При сохранении произошла ошибка.\n' + formatLog(res));
        }
      },
      openItem: function (index, event) {
        if (event.target.tagName != 'INPUT') {
          this.curItem = this.list[index];
          this.curItem.date = new Date(Date.parse(this.curItem.date_open));          
          this.lessons = a('lessons', 'get', {statement: this.curItem.id});
          this.students = a('students', 'get', {group: this.curItem.group});
          this.records = a('records', 'get', {lessons: getIndices(this.lessons), students: getIndices(this.students)});

          this.themes = a('themes', 'get', {discipline: this.curItem.discipline});
          this.themesIndexed = arrayIndex(this.themes);

          var res = [];
          this.themes.forEach(function (theme) {
            res.push({
              value: theme.id,
              label: theme.name,
            })
          });
          this.themesSelect = res;
        }
      },
      closeItem: function (id, index) {
        this.curItem = false;
      },
      openPdf: function (id, index) {
        /*
        var user = a('users')[0];
        var widths = ['auto', 'auto', 'auto'];
        var headerRow = [
          {text: '№', style: 'th', rowSpan: 2}, 
          {text: 'Фамилия Имя', style: 'th', rowSpan: 2, colSpan: 2}, {},
          {text: 'ДАТЫ ПРОВЕДЕНИЯ ЗАНЯТИЙ', style: 'th', colSpan: this.lessons.length*2}
        ];
        var lessonsRow = [{},{},{}];
        var controlRow = [{text: 'Контролирующие мероприятия', colSpan: 3},{},{}];
        for (var i = 0; i < this.lessons.length; i++) {
          lessonsRow.push({
            text: this.lessons[i].date.substr(-2) + '.' + this.lessons[i].date.substr(-5,2),
            colSpan: 2,
            alignment: 'center'
          },{});
          headerRow.push({},{});
          controlRow.push(
            {text: this.lessons[i].control1?this.lessons[i].control1:'', writingMode: 'tb-rl'},
            {text: this.lessons[i].control2?this.lessons[i].control2:'', writingMode: 'tb-rl'}
          );
          widths.push(5,5);
        }
        headerRow.pop();
        lessonsRow.push({},{},{});
        widths.push('auto','auto','auto');
        controlRow.push({},{},{text: 'Итого за ' + this.curItem.month + ' : ' + this.lessons.length*2 + ' ' + plural(this.lessons.length*2, ['час','часа','часов'])});
        headerRow.push(
          {text: 'дата \n занятия', style: 'th', rowSpan: 2}, 
          {text: 'Краткое содержание занятия, \n домашнее занятие', style: 'th', rowSpan: 2}, 
          {text: 'подпись \n преподавателя', style: 'th', rowSpan: 2}
        )
        var mainTable = [headerRow,lessonsRow];
        for (var i = 0; i < this.students.length; i++) {
          var tempRow = [
            i+1,
            {text: this.students[i].surname, border: [true, true, false, true]},
            {text: this.students[i].name, border: [false, true, true, true]},
          ];

          for (var j = 0; j < this.lessons.length; j++) {
            tempRow.push(
              {text: this.getRecord(this.students[i].id, this.lessons[j].id, true).mark1},
              {text: this.getRecord(this.students[i].id, this.lessons[j].id, true).mark2}
            );
          }

          tempRow.push({text: ''},{text: ''},{text: ''});

          mainTable.push(tempRow);
        }
        mainTable.push(controlRow);

        console.log(mainTable);
        var docInfo = {
          info: {
           title:'Табель успеваемости',
          },
          
          pageSize:'A4',
          pageOrientation:'landscape',//'portrait'
          pageMargins:[20, 15],
          
          defaultStyle: {
            font: 'Bookman',
            fontSize: 7,
          },
          styles: {
            hBold: {
              bold: true,
              fontSize: 9
            },
            th: {
              fillColor: '#eeeeee',
              alignment: 'center'
            }
          },
          content: [
            {
              text: [
                { text: 'Табель за ' }, 
                { text: this.curItem.month, style: 'hBold' }, 
                { text: ' месяц, группа ' }, 
                { text: this.curItem.groupName, style: 'hBold' }, 
                { text: ', преподаватель: ' }, 
                { text: (user.surname + ' ' + user.name + ' ' + user.patronymic), style: 'hBold' }
              ],
            },
            {
              text: [
                { text: 'Учебная дисциплина: ' }, 
                { text: this.curItem.disciplineName, style: 'hBold' }, 
              ],
              margin: [0, 10, 0, 20]
            },
            {
              table: {
                widths: widths,
                headerRows: 2,

                body: mainTable
              }
            }
          ],
        }
        pdfMake.fonts = {
            // Шрифты в файле vfs_fonts.js в формате base64
            Bookman: {
              normal: 'Bookman-Regular.ttf',
              bold: 'Bookman-Bold.ttf',
          },
        }
        pdfMake.createPdf(docInfo).open();
        */
      },
      daysInMonth: function () {
        var names = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
        var month = this.curItem.date.getMonth()-1;
        var year = this.curItem.date.getFullYear();
        var count = new Date(year, month + 1, 0).getDate();
        var res = [];
        for (var i = 26; i <= count; i++) {
          res.push({
            str: i + ' ' + names[month],
            val: (new Date(year, month, i+1)).toISOString().substr(0,10)
          });
        }
        month++;
        for (var i = 1; i <= 25; i++) {
          res.push({
            str: i + ' ' + names[month],
            val: (new Date(year, month, i+1)).toISOString().substr(0,10)
          });
        }
        return res;
      },
      addLesson: function () {
        this.curLesson = {
          statement: this.curItem.id
        }
      },
      saveLesson: function () {
        var theme = this.curLesson.theme;
        this.curLesson.theme = theme?theme.value:undefined;
        if (this.curLesson.id) {
          res = a('lessons/' + this.curLesson.id, 'patch', this.curLesson);
          if (res.id) {
            this.curLesson = false;
          }
        } else {
          res = a('lessons', 'post', this.curLesson);
          if (res.id) {
            // alert('Занятие успешно добавлено');
            this.curLesson = false;
            this.lessons.push(res);
            this.lessons.sort(function (a,b) {
              return a.date.localeCompare(b.date);
            });
          }
        }
        this.curLesson.theme = theme;
        if (!res.id) {
          alert('При сохранении произошла ошибка.\n' + formatLog(res));
        }
      },
      editLesson: function (index) {
        this.curLesson = this.lessons[index];
        this.curLesson.theme = {
          value: this.curLesson.theme,
          label: this.themesIndexed[this.curLesson.theme].name,
        };
      },
      closeLesson: function () {
        this.curLesson.theme = this.curLesson.theme.value;
        this.curLesson = false;
      },
      removeLesson: function (id, index) {
        if (confirm('Вы точно хотите удалить это занятие?')) {
          a('lessons/' + id, 'delete');
          this.lessons.splice(index, 1);
        }
      },
      getRecord: function (student, lesson, empty = false) {
        for (var i = 0; i < this.records.length; i++) {
          if (this.records[i].student == student && this.records[i].lesson == lesson) {
            return this.records[i];
          }
        }
        return {
          mark1: empty?'':'*',
          mark2: empty?'':'*',
          lesson: lesson,
          student: student,
        };
      },
      setRecord: function (type, val, record) {
        if (type == 'mark1') {
          record.mark1 = val;
        } else {
          record.mark2 = val;
        }
        if (record.id) {
          record = a('records/' + record.id, 'patch', record);
        } else {
          record = a('records', 'post', record);
          if (record.id) {
            this.records.push(record);
          } else {
            alert('При сохранении произошла ошибка.\n' + formatLog(record));
          }
        }
      },
    }
  })
}

if ($('#ved').length) {
  var veds = a('exams');
  var disciplinesSource = a('disciplines');
  var disciplines = arrayIndex(disciplinesSource);
  var groupsSource = a('groups');
  var groups = arrayIndex(groupsSource);
  veds.forEach(function (item) {
    item.disciplineName = disciplines[item.discipline].name;
    item.groupName = groups[item.group].name;
  })

  var vedApp = new Vue({
    el: '#ved',
    data: {
      list: veds,
      filter: {
        discipline: "ns",
        group: "ns",
        status: "ns",
      },
      disciplines: disciplinesSource,
      groups: groupsSource,

      curItem: false,
      newVed: false,
      students: [],
      examlists: [],
    },
    computed: {
      filterList: function () {
        return this.list.filter(function (item) {
          filter = this;
          if (filter.discipline != "ns" && item.discipline != filter.discipline) {
            return false;
          }
          if (filter.group != "ns" && item.group != filter.group) {
            return false;
          }
          if (filter.status != "ns" && ((item.closed && filter.status == 1) || (!item.closed && filter.status == 2))) {
            return false;
          }
          return true;
        }, this.filter)
      },
    },
    methods: {
      closeVed: function (id, index) {
        if (confirm('Вы точно хотите закрыть ведомость?')) {
          var res = a('exams/' + id, 'patch', {closed: true});
          if (res.id) {
            this.list[index].closed = true;
          }
        }
      },
      createVed: function () {
        this.newVed = {
          closed: false
        };
      },
      saveNewVed: function () {
        for (var i = 0; i < this.list.length; i++) {
          if (this.list[i].discipline == this.newVed.discipline && this.list[i].group == this.newVed.group && this.list[i].date == this.newVed.date) {
            alert('Такая ведомость уже существует!');
            return false;
          }
        }
        var res = a('exams', 'post', this.newVed);
        if (res.id) {
          this.list.unshift({
            id: res.id,
            date: this.newVed.date,
            discipline: res.discipline,
            group: res.group,
            disciplineName: disciplines[res.discipline].name,
            groupName: groups[res.group].name,
          });
          this.newVed = false;
        } else {
          alert('При сохранении произошла ошибка.\n' + formatLog(res));
        }
      },
      openItem: function (index, event) {
        if (event.target.tagName != 'INPUT') {
          this.curItem = this.list[index];
          this.students = a('students', 'get', {group: this.curItem.group});
          this.examlists = a('examlists', 'get', {exam: this.curItem.id});
        }
      },
      closeItem: function (id, index) {
        this.curItem = false;
      },
      openPdf: function (id, index) {
        alert('Pdf версия в новой вкладке');
      },
      getExamlist: function (student) {
        for (var i = 0; i < this.examlists.length; i++) {
          if (this.examlists[i].student == student) {
            return this.examlists[i];
          }
        }
        return {
          exam: this.curItem.id,
          student: student,
        };
      },
      setExamlist: function (type, val, examlist) {
        if (type == 'ticket') {
          examlist.ticket = val;
        } else {
          examlist.mark = val;
        }
        if (examlist.id) {
          examlist = a('examlists/' + examlist.id, 'patch', examlist);
        } else {
          examlist = a('examlists', 'post', examlist);
          if (examlist.id) {
            this.examlists.push(examlist);
          } else {
            alert('При сохранении произошла ошибка.\n' + formatLog(examlist));
          }
        }
      },
    }
  })
}

if ($('#disciplines').length) {
  var teachers = a('users', 'get', {teachersOnly: true});
  teachers.forEach(function (item) {
    item.fio = item.surname + ' ' + item.name + ' ' + item.patronymic;
  });
  var disciplines = a('disciplines');
  disciplines.forEach(function (item) {
    item.change = false;
  });

  var disApp = new Vue({
    el: '#disciplines',
    data: {
      list: disciplines,
      teachers: teachers,
      teachersArr: arrayIndex(teachers),
      themes: false,

      newItem: false,
      curItem: false,
      importText: '',
    },
    methods: {
      deleteItem: function (id, index) {
        if (confirm('Вы точно хотите удалить эту дисциплину?')) {
          a('disciplines/' + id, 'delete');
          this.list.splice(index, 1);
        }
      },
      createItem: function () {
        this.newItem = {};
      },
      saveNewItem: function () {
        var res = a('disciplines', 'post', this.newItem);
        if (res.id) {
          res.change = false;
          this.list.unshift(res);
          this.newItem = false;
        } else {
          alert('При сохранении произошла ошибка.\n' + formatLog(res));
        }
      },
      saveItem: function (id, index) {
        var res = a('disciplines/' + id, 'patch', this.list[index]);
        if (res.id) {
          this.list[index].change = false;
        } else {
          alert('При сохранении произошла ошибка.\n' + formatLog(res));
        }
      },
      openItem: function (index, event) {
        if (event.target.tagName != 'INPUT' && !this.list[index].change) {
          this.curItem = this.list[index];
          this.themes = a('themes', 'get', {discipline: this.curItem.id});
        }
      },
      closeItem: function () {
        this.curItem = false;
      },
      changeTheme: function (val, index) {
        var item = this.themes[index];
        val = val.replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g,' ').replace(/^\s+|\s+$/,'');

        if (val == '') {
          if (item.id) {
            a('themes/' + item.id, 'delete');
          }
          this.themes.splice(index, 1);
          return;
        }

        item.name = val;
        item.discipline = this.curItem.id;
        var res = item.id ? a('themes/' + item.id, 'patch', item) : a('themes', 'post', item);
        if (res.id) {
          item.id = res.id;
        } else {
          alert('При сохранении произошла ошибка.\n' + formatLog(res));
        }
      },
      removeTheme: function (id, index) {
        if (id) {
          a('themes/' + id, 'delete');
        }
        this.themes.splice(index, 1);
      },
      themesImport: function () {
        var newThemes = this.importText.split(';');
        for (var i = 0; i < newThemes.length; i++) {
          var text = newThemes[i].replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g,' ').replace(/^\s+|\s+$/,'');
          if (text != '') {
            var res = a('themes', 'post', {name: text, discipline: this.curItem.id});
            if (res.id) {
              this.themes.push(res);
            }
          }
        }
        this.importText = '';
      }
    }
  })
}

if ($('#groups').length) {
  var groups = a('groups');
  groups.forEach(function (item) {
    item.change = false;
  });
  var groupsApp = new Vue({
    el: '#groups',
    data: {
      list: groups,
      students: false,

      newItem: false,
      curItem: false,
    },
    methods: {
      deleteItem: function (id, index) {
        if (confirm('Вы точно хотите удалить эту группу?')) {
          a('groups/' + id, 'delete');
          this.list.splice(index, 1);
        }
      },
      createItem: function () {
        this.newItem = {};
      },
      saveNewItem: function () {
        this.newItem.date_create = (new Date()).toISOString().substr(0,10);
        var res = a('groups', 'post', this.newItem);
        if (res.id) {
          res.change = false;
          this.list.unshift(res);
          this.newItem = false;
        } else {
          alert('При сохранении произошла ошибка.\n' + formatLog(res));
        }
      },
      saveItem: function (id, index) {
        var res = a('groups/' + id, 'patch', this.list[index]);
        if (res.id) {
          this.list[index].change = false;
        } else {
          alert('При сохранении произошла ошибка.\n' + formatLog(res));
        }
      },
      openItem: function (index, event) {
        if (event.target.tagName != 'INPUT' && !this.list[index].change) {
          this.curItem = this.list[index];
          this.students = a('students', 'get', {group: this.curItem.id});
        }
      },
      closeItem: function () {
        this.curItem = false;
      },
      changeStudent: function (field, val, index) {
        var item = this.students[index];
        var res;
        item[field] = val;
        if (item.id) {
          res = a('students/' + item.id, 'patch', item);
          if (!res.id) {
            alert('При сохранении произошла ошибка.\n' + formatLog(res));
          }
        } else {
          if (item.surname && item.name) {
            item.group = this.curItem.id;
            res = a('students', 'post', item);
            if (res.id) {
              item.id = res.id;
            } else {
              alert('При сохранении произошла ошибка.\n' + formatLog(res));
            }
          }
        }
      },
      removeStudent: function (id, index) {
        if (id) {
          a('students/' + id, 'delete');
        }
        this.students.splice(index, 1);
      },
    }
  })
}

if ($('#docs').length) {
  var groupsApp = new Vue({
    el: '#docs',
    data: {
      groups: a('groups'),
      curGroup: false,
      students: false,
      examlists: false,
      terms: []
    },
    methods: {
      openDoc: function (group) {
        this.terms = [];
        var num = 1;

        this.curGroup = group;
        this.students = a('students', 'get', {group: group.id});
        var exams = a('exams', 'get', {group: group.id});
        if (this.students.length == 0 || exams.length == 0) {
          return;
        }
        var disciplines = arrayIndex(a('disciplines'));
        this.examlists = a('examlists', 'get', {group: group.id});
        var start_year = Number(group.date_create.substr(0,4));
        var end_year = (new Date()).getFullYear();

        for (var year = start_year; year < end_year; year++) {
          var date_start1 = String(year)+'-09-01';
          var date_start2 = String(year+1)+'-01-01';
          var date_end = String(year+1)+'-09-01';
          var dics, marks;
          var thisExams1 = [];
          var thisExams2 = [];
          for (var i = 0; i < exams.length; i++) {
            if (exams[i].date >= date_start1 && exams[i].date < date_end) {
              marks = [];
              for (var j = 0; j < this.students.length; j++) {
                marks.push(this.getMark(exams[i].id, this.students[j].id));
              }
            }
            if (exams[i].date >= date_start1 && exams[i].date < date_start2) {
              thisExams1.push({
                name: disciplines[exams[i].discipline].name,
                marks: marks
              });
            } else if (exams[i].date >= date_start2 && exams[i].date < date_end) {
              thisExams2.push({
                name: disciplines[exams[i].discipline].name,
                marks: marks
              });
            }
          }

          this.terms.push({
            name: num++ + ' семестр',
            exams: thisExams1
          });
          this.terms.push({
            name: num++ + ' семестр',
            exams: thisExams2
          });
        }
      },
      getMark: function (examId, studentId) {
        for (var i = 0; i < this.examlists.length; i++) {
          if (this.examlists[i].exam == examId && this.examlists[i].student == studentId) {
            return this.examlists[i].mark;
          }
        }
        return '';
      }
    }
  })
}

// Components end