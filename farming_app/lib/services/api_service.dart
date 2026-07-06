import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:io' show Platform;

class ApiService {
  // Use 10.0.2.2 for Android emulator to access localhost
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api/v1';
    } else {
      return 'http://localhost:5000/api/v1';
    }
  }

  static Future<List<dynamic>> fetchCollection(String collection) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/$collection'));
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        // The backend returns { data: { rows: [...] } }
        if (data['data'] != null && data['data']['rows'] != null) {
          return data['data']['rows'];
        }
      }
      return [];
    } catch (e) {
      print('Error fetching $collection: $e');
      return [];
    }
  }
}
