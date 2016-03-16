<div style="margin-top:25px; text-align:center; font-size:20px;">
   {{=it.title}} Todos (&nbsp;<span class='count'>{{=it.items.length}}</span>&nbsp;) - swipe to archive
</div>
<ul id="todo-list" class="{{=it.listCSS}}">
    {{ for(var i=0;i<it.items.length;i++){
    }}
     <li>
       <input data-id='{{=it.items[i].id}}' id='{{=it.items[i].id}}' class="check" type="checkbox" value='{{=it.state}}' {{=it.checked}} />  <label for="{{=it.items[i].id}}"></label>
        <div class="todo-text" >{{=it.items[i].text}}</div>
        <span class="todo-destroy" style="display:none;">
            <input data-id='{{=it.items[i].id}}' type="button" class='handleArchive' value="{{=it.archiveText}}" style="width: 90px;height: 43px;" />
        </span>
    </li>
    {{}}}
</ul>