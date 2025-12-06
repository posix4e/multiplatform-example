import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    private let logger = Logger(subsystem: "com.multiplatform.example", category: "SafariExtension")

    func beginRequest(with context: NSExtensionContext) {
        guard let item = context.inputItems.first as? NSExtensionItem,
              let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }

        logger.info("Received message from extension: \(String(describing: message))")

        // Handle different message types
        if let messageType = message["type"] as? String {
            switch messageType {
            case "history_entry":
                handleHistoryEntry(message: message, context: context)
            default:
                sendResponse(["status": "unknown_message_type"], context: context)
            }
        } else {
            sendResponse(["status": "error", "message": "No message type provided"], context: context)
        }
    }

    private func handleHistoryEntry(message: [String: Any], context: NSExtensionContext) {
        guard let payload = message["payload"] as? [String: Any],
              let url = payload["url"] as? String,
              let title = payload["title"] as? String,
              let timestamp = payload["timestamp"] as? Int64 else {
            sendResponse(["status": "error", "message": "Invalid payload"], context: context)
            return
        }

        // Store in App Groups shared container for the main Tauri app to read
        if let sharedDefaults = UserDefaults(suiteName: "group.com.multiplatform.example") {
            var history = sharedDefaults.array(forKey: "browserHistory") as? [[String: Any]] ?? []
            history.append([
                "url": url,
                "title": title,
                "timestamp": timestamp
            ])

            // Keep only last 100 entries
            if history.count > 100 {
                history = Array(history.suffix(100))
            }

            sharedDefaults.set(history, forKey: "browserHistory")

            // Post notification for main app
            DistributedNotificationCenter.default().post(
                name: NSNotification.Name("com.multiplatform.example.newHistoryEntry"),
                object: nil,
                userInfo: ["url": url, "title": title, "timestamp": timestamp]
            )

            logger.info("Saved history entry: \(url)")
            sendResponse(["status": "ok"], context: context)
        } else {
            sendResponse(["status": "error", "message": "Could not access shared container"], context: context)
        }
    }

    private func sendResponse(_ response: [String: Any], context: NSExtensionContext) {
        let responseItem = NSExtensionItem()
        responseItem.userInfo = [SFExtensionMessageKey: response]
        context.completeRequest(returningItems: [responseItem], completionHandler: nil)
    }
}
