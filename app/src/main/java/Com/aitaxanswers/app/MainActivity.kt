package Com.aitaxanswers.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class TaxViewModel:ViewModel(){val messages=mutableStateListOf<ChatMessage>();var busy by mutableStateOf(false);var error by mutableStateOf<String?>(null);private val api=TaxApi();suspend fun send(topic:String,text:String){if(text.isBlank()||busy)return;messages+=ChatMessage("user",text);busy=true;error=null;try{messages+=ChatMessage("assistant",withContext(Dispatchers.IO){api.ask(topic,messages.toList())})}catch(e:Exception){error=e.message;messages.removeLast()}finally{busy=false}}}

class MainActivity:ComponentActivity(){override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);setContent{TaxApp()}}}

@Composable fun TaxApp(vm:TaxViewModel= viewModel()){
    val scope=rememberCoroutineScope();var text by remember{mutableStateOf("")};var topic by remember{mutableStateOf("dependents")}
    MaterialTheme(colorScheme=lightColorScheme(primary=Color(0xFF214F40),background=Color(0xFFF6F7F2))){Scaffold(topBar={TopAppBar(title={Text("✳  Tax Answers")},actions={Text("IRS sources",modifier=Modifier.padding(16.dp))})}){pad->Column(Modifier.fillMaxSize().background(Color(0xFFF6F7F2)).padding(pad).padding(18.dp)){
        if(vm.messages.isEmpty()){Text("Taxes are complicated.\nYour answers shouldn't be.",style=MaterialTheme.typography.headlineLarge);Spacer(Modifier.height(12.dp));Text("Ask naturally. The assistant will find the IRS rules and ask about the details that matter.");Spacer(Modifier.height(18.dp));TopicPicker(topic){topic=it}}
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)){items(vm.messages){m->Card(colors=CardDefaults.cardColors(containerColor=if(m.role=="user")Color(0xFFE6EDDF)else Color.White)){Column(Modifier.padding(16.dp)){Text(if(m.role=="user")"YOU" else "TAX ANSWERS",style=MaterialTheme.typography.labelSmall);Text(m.content)}}}}
        vm.error?.let{Text(it,color=MaterialTheme.colorScheme.error)};Row{OutlinedTextField(text,{text=it},Modifier.weight(1f),placeholder={Text("Your federal tax question")},enabled=!vm.busy);Spacer(Modifier.width(8.dp));Button(onClick={val q=text;text="";scope.launch{vm.send(topic,q)}},enabled=text.isNotBlank()&&!vm.busy){Text(if(vm.busy)"…" else "Ask")}}
        Text("Tax information, not an IRS service or professional advice. Do not enter SSNs or bank details.",style=MaterialTheme.typography.labelSmall,modifier=Modifier.padding(top=12.dp))
    }}}
}

@Composable private fun TopicPicker(selected:String,onSelect:(String)->Unit){val topics=listOf("dependents" to "Dependents & filing status","self-employment" to "1099 & self-employment","deductions" to "Deductions & credits","payments" to "Estimated taxes & payments","other" to "Another federal tax question");var open by remember{mutableStateOf(false)};Box{OutlinedButton(onClick={open=true}){Text(topics.first{it.first==selected}.second)};DropdownMenu(open,{open=false}){topics.forEach{DropdownMenuItem({Text(it.second)},{onSelect(it.first);open=false})}}}}
