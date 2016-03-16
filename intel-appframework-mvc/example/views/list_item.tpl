<li>
       <input data-id='{{=it.entry.id}}' id='{{=it.entry.id}}' class="check" type="checkbox" value='active'  />  <label for="{{=it.entry.id}}"></label>
        <div class="todo-text" >{{=it.entry.text}}</div>
        <span class="todo-destroy" style="display:none;">
            <input data-id='{{=it.entry.id}}' type="button" class='handleArchive' value="{{=it.archiveText}}" style="width: 90px;height: 43px;" />
        </span>
    </li>