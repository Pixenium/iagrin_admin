import 'package:flutter/material.dart';
import '../models/news.dart';
import '../models/event.dart';
import '../models/scheme.dart';
import '../models/machinery.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class DataProvider with ChangeNotifier {
  List<News> newsList = [];
  List<Event> eventList = [];
  List<Scheme> schemeList = [];
  List<Machinery> machineryList = [];

  bool isLoadingNews = true;
  bool isLoadingEvents = true;
  bool isLoadingSchemes = true;
  bool isLoadingMachinery = true;

  DataProvider() {
    _initData();
    _setupSockets();
  }

  void _initData() {
    fetchNews();
    fetchEvents();
    fetchSchemes();
    fetchMachinery();
  }

  void _setupSockets() {
    final socketService = SocketService();
    
    socketService.on('news:changed', () {
      fetchNews(); // Refetch instantly on change
    });
    
    socketService.on('events:changed', () {
      fetchEvents();
    });
    
    socketService.on('schemes:changed', () {
      fetchSchemes();
    });
    
    socketService.on('machinery:changed', () {
      fetchMachinery();
    });
  }

  Future<void> fetchNews() async {
    isLoadingNews = true;
    notifyListeners();
    final data = await ApiService.fetchCollection('news');
    newsList = data.map((json) => News.fromJson(json)).toList();
    isLoadingNews = false;
    notifyListeners();
  }

  Future<void> fetchEvents() async {
    isLoadingEvents = true;
    notifyListeners();
    final data = await ApiService.fetchCollection('events');
    eventList = data.map((json) => Event.fromJson(json)).toList();
    isLoadingEvents = false;
    notifyListeners();
  }

  Future<void> fetchSchemes() async {
    isLoadingSchemes = true;
    notifyListeners();
    final data = await ApiService.fetchCollection('schemes');
    schemeList = data.map((json) => Scheme.fromJson(json)).toList();
    isLoadingSchemes = false;
    notifyListeners();
  }

  Future<void> fetchMachinery() async {
    isLoadingMachinery = true;
    notifyListeners();
    final data = await ApiService.fetchCollection('machinery');
    machineryList = data.map((json) => Machinery.fromJson(json)).toList();
    isLoadingMachinery = false;
    notifyListeners();
  }
}
