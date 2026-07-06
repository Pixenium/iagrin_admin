import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/data_provider.dart';

class SchemesScreen extends StatelessWidget {
  const SchemesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<DataProvider>(
      builder: (context, provider, child) {
        if (provider.isLoadingSchemes) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.schemeList.isEmpty) {
          return const Center(child: Text('No schemes available.'));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(8.0),
          itemCount: provider.schemeList.length,
          itemBuilder: (context, index) {
            final scheme = provider.schemeList[index];
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
              child: ListTile(
                leading: scheme.coverImage.isNotEmpty 
                    ? Image.network(scheme.coverImage, width: 60, height: 60, fit: BoxFit.cover,
                        errorBuilder: (c, e, s) => const Icon(Icons.account_balance, size: 40))
                    : const Icon(Icons.account_balance, size: 40),
                title: Text(scheme.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    Text(scheme.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text('${scheme.provider} • Deadline: ${scheme.deadline}', style: TextStyle(fontSize: 12, color: Colors.green[700])),
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
