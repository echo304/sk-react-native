import React from 'react-native';
import { UserCalendarPaginator } from '../../songkick-api';
import colors from '../../colors';
import CalendarEntry from './calendar-entry';
import moment from 'moment';

const {
  Text,
  ListView,
  ActivityIndicatorIOS,
  View,
} = React;

class CalendarEntries extends React.Component {

  constructor() {
    super();

    this.state = {
      loaded: false,
      dataSource: new ListView.DataSource({
          getSectionData          : (dataBlob, sectionID) => dataBlob[sectionID],
          getRowData              : (dataBlob, sectionID, rowID) => dataBlob[sectionID + ':' + rowID],
          rowHasChanged           : (row1, row2) => row1 !== row2,
          sectionHeaderHasChanged : (s1, s2) => s1 !== s2
      }),
      entries: [],
    };

    this.setCalendarEntries = this.setCalendarEntries.bind(this);
    this.paginator = new UserCalendarPaginator();
  }

  componentWillMount(){
    this.fetchNextCalendarEntries();
  }

  fetchNextCalendarEntries() {
    const {username} = this.props;
    this.paginator.fetchNext({username}).then(this.setCalendarEntries);
  }

  setCalendarEntries(entries) {
    console.log('entries', entries);
    const entriesByDate = entries.reduce(function(result, entry){
      const date = entry.event.start.date;
      result[date] = result[date] || [];
      result[date].push(entry);

      return result;
    }, {});

    const sectionIDs = [];
    const rowIDs = [];
    const dataBlob = {};

    Object.keys(entriesByDate).forEach(function(date, index){
      dataBlob[date] = date;
      sectionIDs.push(date);
      rowIDs[index] = [];
      const entriesForDate = entriesByDate[date];

      entriesForDate.forEach(function(entry){
        const entryKey = `${date}:${entry.event.id}`;
        rowIDs[index].push(entry.event.id);
        dataBlob[entryKey] = entry;
      });
    });

    this.setState({
      dataSource: this.state.dataSource.cloneWithRowsAndSections(dataBlob, sectionIDs, rowIDs),
      loaded: true,
      loadingMore: false,
      page: ++this.state.page,
      entries,
    });
  }

  renderCalendarEntries(calendarEntry){
    return <CalendarEntry entry={calendarEntry}/>;
  }

  renderSectionHeader(date){
    const formatted = moment(date).format('dddd D MMMM YYYY');
    return <Text style={styles.dateSection}>{formatted}</Text>;
  }

  renderLoading(){
    return (
      <View style={styles.centering}>
        <ActivityIndicatorIOS color={colors.light} size="large"/>
      </View>
    );
  }

  renderListView(){
    return <ListView
      style= {{backgroundColor: colors.dark, marginBottom: 110}}
      dataSource={this.state.dataSource}
      renderRow={this.renderCalendarEntries}
      renderSectionHeader = {this.renderSectionHeader}
      onEndReached={this.fetchNextCalendarEntries.bind(this)}
    />;
  }

  render() {
    if (!this.state.loaded) {
      return this.renderLoading();
    }

    return this.renderListView();
  }
}

const styles = {
  dateSection: {
    color: colors.lighter,
    fontWeight: 'bold',
    marginLeft: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  centering: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.dark,
  },
};

export default CalendarEntries;
