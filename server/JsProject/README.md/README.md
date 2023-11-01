#### Xiang Wang @ 2017-05-24 13:40:52

# Documentation

## Installation
```
pip install week
```

## Usage
```
>>> import datetime
>>> from week import Week
>>> Week.thisweek() == Week.create_from_date(datetime.date.today())
True
>>> week = Week.thisweek()
>>> week.startdate
datetime.date(2017, 5, 22)
>>> next_week = week.get_next_week()
>>> next_week.enddate
datetime.date(2017, 6, 4)
>>> another_week = week + 1
>>> another_week == next_week
True
>>> print(Week.create_from_date(datetime.date(2017,1,1)))
2016year 52week
>>> print(Week.create_from_date(datetime.date(2017,1,10)))
2017year 2week
```
