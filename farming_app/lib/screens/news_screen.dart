import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/data_provider.dart';

class NewsScreen extends StatelessWidget {
  const NewsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<DataProvider>(
      builder: (context, provider, child) {
        if (provider.isLoadingNews) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.newsList.isEmpty) {
          return const Center(child: Text('No news articles available.'));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(8.0),
          itemCount: provider.newsList.length,
          itemBuilder: (context, index) {
            final news = provider.newsList[index];
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
              child: ListTile(
                leading: news.coverImage.isNotEmpty 
                    ? Image.network(news.coverImage, width: 60, height: 60, fit: BoxFit.cover,
                        errorBuilder: (c, e, s) => const Icon(Icons.article, size: 40))
                    : const Icon(Icons.article, size: 40),
                title: Text(news.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    Text(news.summary, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text('${news.category} • ${news.source}', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
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
