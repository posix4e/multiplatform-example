package com.multiplatform.example.autofill

import android.app.assist.AssistStructure
import android.content.Intent
import android.os.CancellationSignal
import android.service.autofill.*
import android.util.Log
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews

class MyAutofillService : AutofillService() {

    companion object {
        private const val TAG = "MyAutofillService"
    }

    override fun onFillRequest(
        request: FillRequest,
        cancellationSignal: CancellationSignal,
        callback: FillCallback
    ) {
        Log.d(TAG, "onFillRequest called")

        val context = request.fillContexts
        val structure = context.last().structure

        // Parse the structure to find autofillable fields
        val fields = parseStructure(structure)

        if (fields.isEmpty()) {
            Log.d(TAG, "No autofillable fields found")
            callback.onSuccess(null)
            return
        }

        // Get the domain/package requesting autofill
        val packageName = structure.activityComponent?.packageName ?: "unknown"
        Log.d(TAG, "Autofill request from: $packageName")

        // Notify the main Tauri app about the autofill request
        notifyTauriApp(packageName, fields)

        // For demo purposes, create a simple response
        // In a real app, you'd query stored credentials
        val responseBuilder = FillResponse.Builder()

        // Create a dataset (credential option)
        val usernameField = fields.find { it.type == FieldType.USERNAME }
        val passwordField = fields.find { it.type == FieldType.PASSWORD }

        if (usernameField != null || passwordField != null) {
            val dataset = Dataset.Builder()

            // Create presentation for the autofill dropdown
            val presentation = RemoteViews(packageName, android.R.layout.simple_list_item_1)
            presentation.setTextViewText(android.R.id.text1, "Demo Credential")

            usernameField?.let {
                dataset.setValue(
                    it.autofillId,
                    AutofillValue.forText("demo@example.com"),
                    presentation
                )
            }

            passwordField?.let {
                dataset.setValue(
                    it.autofillId,
                    AutofillValue.forText(""),  // Never prefill passwords in demo
                    presentation
                )
            }

            try {
                responseBuilder.addDataset(dataset.build())
            } catch (e: Exception) {
                Log.e(TAG, "Error building dataset", e)
            }
        }

        // Add a "Save" prompt for when user enters new credentials
        val saveInfo = SaveInfo.Builder(
            SaveInfo.SAVE_DATA_TYPE_USERNAME or SaveInfo.SAVE_DATA_TYPE_PASSWORD,
            fields.map { it.autofillId }.toTypedArray()
        ).build()

        responseBuilder.setSaveInfo(saveInfo)

        try {
            callback.onSuccess(responseBuilder.build())
        } catch (e: Exception) {
            Log.e(TAG, "Error completing autofill", e)
            callback.onSuccess(null)
        }
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        Log.d(TAG, "onSaveRequest called")

        val context = request.fillContexts
        val structure = context.last().structure
        val fields = parseStructure(structure)

        // Extract entered values
        val savedData = mutableMapOf<String, String>()

        for (field in fields) {
            val node = findNodeById(structure, field.autofillId)
            node?.autofillValue?.let { value ->
                if (value.isText) {
                    savedData[field.type.name] = value.textValue.toString()
                }
            }
        }

        // Send to Tauri app for storage
        val packageName = structure.activityComponent?.packageName ?: "unknown"
        sendCredentialsToTauri(packageName, savedData)

        callback.onSuccess()
    }

    private fun parseStructure(structure: AssistStructure): List<AutofillField> {
        val fields = mutableListOf<AutofillField>()

        for (i in 0 until structure.windowNodeCount) {
            val windowNode = structure.getWindowNodeAt(i)
            traverseNode(windowNode.rootViewNode, fields)
        }

        return fields
    }

    private fun traverseNode(node: AssistStructure.ViewNode?, fields: MutableList<AutofillField>) {
        if (node == null) return

        val autofillId = node.autofillId
        val autofillHints = node.autofillHints
        val inputType = node.inputType

        if (autofillId != null && (autofillHints?.isNotEmpty() == true || inputType != 0)) {
            val fieldType = determineFieldType(autofillHints, inputType, node.hint, node.idEntry)

            if (fieldType != FieldType.UNKNOWN) {
                fields.add(AutofillField(autofillId, fieldType))
            }
        }

        // Traverse children
        for (i in 0 until node.childCount) {
            traverseNode(node.getChildAt(i), fields)
        }
    }

    private fun determineFieldType(
        hints: Array<String>?,
        inputType: Int,
        hint: CharSequence?,
        idEntry: String?
    ): FieldType {
        // Check explicit autofill hints
        hints?.forEach { h ->
            when (h) {
                android.view.View.AUTOFILL_HINT_USERNAME,
                android.view.View.AUTOFILL_HINT_EMAIL_ADDRESS -> return FieldType.USERNAME
                android.view.View.AUTOFILL_HINT_PASSWORD -> return FieldType.PASSWORD
            }
        }

        // Check hint text
        val hintLower = hint?.toString()?.lowercase() ?: ""
        val idLower = idEntry?.lowercase() ?: ""

        if (hintLower.contains("email") || hintLower.contains("username") ||
            idLower.contains("email") || idLower.contains("username")) {
            return FieldType.USERNAME
        }

        if (hintLower.contains("password") || idLower.contains("password")) {
            return FieldType.PASSWORD
        }

        return FieldType.UNKNOWN
    }

    private fun findNodeById(structure: AssistStructure, targetId: AutofillId): AssistStructure.ViewNode? {
        for (i in 0 until structure.windowNodeCount) {
            val result = findNodeByIdRecursive(structure.getWindowNodeAt(i).rootViewNode, targetId)
            if (result != null) return result
        }
        return null
    }

    private fun findNodeByIdRecursive(node: AssistStructure.ViewNode?, targetId: AutofillId): AssistStructure.ViewNode? {
        if (node == null) return null
        if (node.autofillId == targetId) return node

        for (i in 0 until node.childCount) {
            val result = findNodeByIdRecursive(node.getChildAt(i), targetId)
            if (result != null) return result
        }
        return null
    }

    private fun notifyTauriApp(packageName: String, fields: List<AutofillField>) {
        // Send intent to main Tauri app
        val intent = Intent("com.multiplatform.example.AUTOFILL_REQUEST").apply {
            putExtra("package", packageName)
            putExtra("field_count", fields.size)
        }

        try {
            sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to notify Tauri app", e)
        }
    }

    private fun sendCredentialsToTauri(packageName: String, credentials: Map<String, String>) {
        val intent = Intent("com.multiplatform.example.SAVE_CREDENTIAL").apply {
            putExtra("package", packageName)
            putExtra("username", credentials["USERNAME"] ?: "")
        }

        try {
            sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send credentials to Tauri app", e)
        }
    }

    data class AutofillField(val autofillId: AutofillId, val type: FieldType)

    enum class FieldType {
        USERNAME,
        PASSWORD,
        UNKNOWN
    }
}
