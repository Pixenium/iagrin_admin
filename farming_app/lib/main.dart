import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'iAgrin Farming App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: const SocketHomePage(title: 'iAgrin Dynamic Realtime Data'),
    );
  }
}

class SocketHomePage extends StatefulWidget {
  const SocketHomePage({super.key, required this.title});

  final String title;

  @override
  State<SocketHomePage> createState() => _SocketHomePageState();
}

class _SocketHomePageState extends State<SocketHomePage> {
  late IO.Socket socket;
  List<String> logs = [];

  @override
  void initState() {
    super.initState();
    initSocket();
  }

  void initSocket() {
    socket = IO.io('http://localhost:4000', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    socket.onConnect((_) {
      print('Connected to Backend');
      setState(() {
        logs.add('✅ Connected to backend');
      });
    });

    // Listen to various generic events
    const events = [
      'users:changed', 'farms:changed', 'soil:changed', 'weather:changed',
      'market:changed', 'notifications:changed', 'news:changed',
      'schemes:changed', 'tasks:changed', 'events:changed',
      'machinery:changed', 'videos:published'
    ];

    for (final event in events) {
      socket.on(event, (data) {
        setState(() {
          logs.add('🔄 Event received: $event');
        });
        print('Event received: $event');
      });
    }

    socket.onDisconnect((_) {
      print('Disconnected from backend');
      setState(() {
        logs.add('❌ Disconnected');
      });
    });
  }

  @override
  void dispose() {
    socket.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Realtime Event Logs:',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: ListView.builder(
                itemCount: logs.length,
                itemBuilder: (context, index) {
                  return ListTile(
                    leading: const Icon(Icons.sync, color: Colors.blue),
                    title: Text(logs[index]),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
