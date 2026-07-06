import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:io' show Platform;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  late IO.Socket socket;
  
  // Callbacks for specific events
  final Map<String, List<Function>> _listeners = {};

  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000';
    } else {
      return 'http://localhost:5000';
    }
  }

  void initSocket() {
    socket = IO.io(baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    socket.onConnect((_) {
      print('Connected to Backend Realtime Socket');
    });

    // Listen for events from our Dynamic Routes
    final eventsToListen = [
      'news:changed',
      'events:changed',
      'schemes:changed',
      'machinery:changed'
    ];

    for (var event in eventsToListen) {
      socket.on(event, (_) {
        print('Socket received event: $event');
        _triggerListeners(event);
      });
    }

    socket.onDisconnect((_) {
      print('Disconnected from Backend Realtime Socket');
    });
  }

  void on(String event, Function callback) {
    if (!_listeners.containsKey(event)) {
      _listeners[event] = [];
    }
    _listeners[event]!.add(callback);
  }

  void _triggerListeners(String event) {
    if (_listeners.containsKey(event)) {
      for (var callback in _listeners[event]!) {
        callback();
      }
    }
  }

  void dispose() {
    socket.dispose();
  }
}
