import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/data_provider.dart';

class EventsScreen extends StatelessWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<DataProvider>(
      builder: (context, provider, child) {
        if (provider.isLoadingEvents) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.eventList.isEmpty) {
          return const Center(child: Text('No events available.'));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(8.0),
          itemCount: provider.eventList.length,
          itemBuilder: (context, index) {
            final event = provider.eventList[index];
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
              child: ListTile(
                leading: event.coverImage.isNotEmpty 
                    ? Image.network(event.coverImage, width: 60, height: 60, fit: BoxFit.cover,
                        errorBuilder: (c, e, s) => const Icon(Icons.event, size: 40))
                    : const Icon(Icons.event, size: 40),
                title: Text(event.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    Text(event.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text('${event.date} • ${event.location}', style: TextStyle(fontSize: 12, color: Colors.blue[600])),
                  ],
                ),
                isThreeLine: true,
              ),
            );
          },
        );
      },
    );
  }
}
