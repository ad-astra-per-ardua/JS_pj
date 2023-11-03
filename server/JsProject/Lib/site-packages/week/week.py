#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Xiang Wang @ 2016-09-18 11:36:43

import datetime
from datetime import date


class Week(object):
    """
        this first monday of a year starts the firt week.
        Every week starts from monday and end in sunday.
    """
    _FIRST_ISOWEEKDAY = 1  # the isoweekday of a week's startdate

    def __init__(self, year, week):
        """
            year: year
            week: week
        """
        assert 1970 < year < 9999
        assert 1 <= week <= 53
        self.year = year
        self.week = week

    def year_start_weekday(self):
        """
        return the first weekday of this year
        monday = 0, sunday = 6
        """
        return date(self.year, 1, 1).weekday()

    def year_start_isoweekday(self):
        """
        return the frist isoweekday of a year
        monday = 1, sunday = 7
        """
        return date(self.year, 1, 1).isoweekday()

    def is_first_day_match(self):
        """
            check if the firstday of this year is the firstday of a week
        """
        return self.year_start_isoweekday() == self._FIRST_ISOWEEKDAY

    @classmethod
    def create_from_date(cls, date_obj):
        """
            date: datetime.date
            example: week = Week.create_from_date(date(2016, 9, 18))
        """
        year = date_obj.year
        week = int(date_obj.strftime('%W'))
        if week == 0:
            date_obj = date(year - 1, 12, 31)
            return cls.create_from_date(date_obj=date_obj)
        week_obj = cls(year=date_obj.year, week=week)
        return week_obj

    @property
    def startdate(self):
        """
        return exist the firstday of week,
        ignoring whether if it is in this year.
        TODO: add parameters to limit the range
        """
        new_years_day = date(year=self.year, month=1, day=1)
        startdate = new_years_day + \
            datetime.timedelta(days=(7 - new_years_day.weekday()) % 7) + \
            datetime.timedelta(days=(self.week - 1) * 7)
        return startdate

    @property
    def startdatetime(self):
        return datetime.datetime.strptime(
            self.startdate.strftime("%Y-%m-%d %H:%M:%S"), "%Y-%m-%d %H:%M:%S")

    @property
    def enddate(self):
        enddate = self.startdate + datetime.timedelta(days=6)
        return enddate

    @property
    def enddatetime(self):
        return datetime.datetime.strptime(
            self.enddate.strftime("%Y-%m-%d %H:%M:%S"), "%Y-%m-%d %H:%M:%S") +\
            datetime.timedelta(days=0, seconds=3600 * 24)

    def next_week(self):
        return Week.create_from_date(
            self.startdate + datetime.timedelta(days=7))

    def get_year_week(self):
        week = "%d%02d" % (self.year, self.week)
        return week

    def __str__(self):
        return "{0}year {1}week".format(self.year, self.week)

    def get_next_week(self):
        """return next week"""
        return Week.create_from_date(
            self.startdate + datetime.timedelta(days=7))

    def get_previous_week(self):
        """return previous week"""
        return Week.create_from_date(
            self.startdate - datetime.timedelta(days=7))

    @classmethod
    def thisweek(self):
        return self.create_from_date(datetime.date.today())

    def __add__(self, integer):
        """n week later"""
        return Week.create_from_date(
            self.startdate + datetime.timedelta(days=7*integer))

    def __sub_integer__(self, integer):
        """n week previous"""
        return Week.create_from_date(
            self.startdate - datetime.timedelta(days=7*integer))

    def __gt__(self, week):
        if self.year > week.year:
            return True
        elif self.year < week.year:
            return False
        else:
            return self.week > week.week

    def __sub__(self, week):
        """calculate the period of two week instance"""
        if isinstance(week, int):
            return self.__sub_integer__(week)
        return (self.startdate - week.startdate).days/7

    def __eq__(self, week):
        return self.get_year_week() == week.get_year_week()


class FromFirstDaysWeek(Week):
    """
        this first day of a year starts the firt week.
        Every week starts from monday and end in sunday.
        year 2019 week 1: date(2019, 1, 1) - date(2019, 1, 6)
        year 2019 week 2: date(2019, 1, 7) - date(2019, 1, 13)
        year 2019 week 52: date(2019, 12, 23) - date(2019, 12, 29)
        year 2019 week 53: date(2019, 12, 30) - date(2019, 12, 31)
        year 2024 week 1: date(2024, 1, 1) - date(2024, 1, 6)
    """
    # TODO test all the other methods,
    # now I only need to use the startdate and enddate,
    # the other functions have not been tested

    def __init__(self, year, week):
        super(FromFirstDaysWeek, self).__init__(year, week)

    @property
    def startdate(self):
        """
        return exist the firstday of week,
        and makesure it will not exceed this year
        TODO: add parameters to limit the range or not
        """
        if self.is_first_day_match():
            return max(
                date(self.year, 1, 1),
                Week(self.year, self.week).startdate)
        else:
            week = Week(self.year, self.week).get_previous_week()
            return max(date(self.year, 1, 1), week.startdate)

    @property
    def enddate(self):
        if self.is_first_day_match():
            week = Week(self.year, self.week)
        else:
            week = Week(self.year, self.week).get_previous_week()
        return min(date(self.year, 12, 31), week.enddate)

    @classmethod
    def create_from_date(cls, date_obj):
        """
            date: datetime.date
            eg: week = FromFirstDaysWeek.create_from_date(date(2016, 9, 18))
        """
        week = int(date_obj.strftime('%W'))
        if date(date_obj.year, 1, 1).isoweekday() != cls._FIRST_ISOWEEKDAY:
            week += 1
        week_obj = cls(year=date_obj.year, week=week)
        return week_obj
