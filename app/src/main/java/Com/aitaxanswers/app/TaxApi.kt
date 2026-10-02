package Com.aitaxanswers.app

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.appcheck.FirebaseAppCheck
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.json.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

data class ChatMessage(val role:String,val content:String)

class TaxApi(private val client:OkHttpClient=OkHttpClient()) {
    private val json=Json { ignoreUnknownKeys=true }
    suspend fun ensureUser():String { val auth=FirebaseAuth.getInstance(); if(auth.currentUser==null)auth.signInAnonymously().await(); return requireNotNull(auth.currentUser).uid }
    suspend fun ask(topic:String,messages:List<ChatMessage>):String {
        val user=ensureUser();val token=FirebaseAuth.getInstance().currentUser!!.getIdToken(false).await().token.orEmpty();val appCheck=FirebaseAppCheck.getInstance().getAppCheckToken(false).await().token
        val body=buildJsonObject { put("topic",topic);putJsonArray("messages"){messages.forEach{addJsonObject{put("role",it.role);put("content",it.content)}}} }.toString()
        val request=Request.Builder().url("${BuildConfig.TAX_API_BASE_URL}/api/chat").header("Authorization","Bearer $token").header("X-Firebase-AppCheck",appCheck).header("X-Client-Id",user).post(body.toRequestBody("application/json".toMediaType())).build()
        client.newCall(request).execute().use { response -> val payload=response.body.string();val data=json.parseToJsonElement(payload).jsonObject;if(!response.isSuccessful)error(data["error"]?.jsonPrimitive?.content?:"Unable to get an answer");return data["text"]?.jsonPrimitive?.content?:error("Empty answer") }
    }
}
